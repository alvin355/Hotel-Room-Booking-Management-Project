import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { del, get, post } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { requireLogin } from "../auth/requireLogin";

// Build the room details API path, including dates when both are set.
function roomUrl(id, checkIn, checkOut) {
  const params = new URLSearchParams();
  if (checkIn && checkOut) {
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
  }
  const query = params.toString();
  return query ? `/rooms/${id}?${query}` : `/rooms/${id}`;
}

// Public page with one room's details.
export function RoomDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin } = useAuth();
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const detailsPath = roomUrl(id, checkIn, checkOut);
  const bookPath = `/book?roomId=${id}`;

  const [room, setRoom] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load this room whenever the id or dates change.
  useEffect(() => {
    loadRoom();
  }, [id, checkIn, checkOut]);

  // Check whether this room is already saved.
  useEffect(() => {
    loadSaved();
  }, [id, isLoggedIn, isAdmin]);

  // Fetch the selected room from the API.
  async function loadRoom() {
    setLoading(true);
    setError("");
    try {
      setRoom(await get(roomUrl(id, checkIn, checkOut)));
    } catch (err) {
      setError(err.message);
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }

  // Fetch bookmarks and see if this room is in the list.
  async function loadSaved() {
    if (!isLoggedIn || isAdmin) {
      setSaved(false);
      return;
    }
    try {
      const list = await get("/bookmarks", { withUser: true });
      setSaved(list.some((item) => item.roomId === id));
    } catch (err) {
      setSaved(false);
    }
  }

  // Bookmark or unbookmark this room, after login if needed.
  async function handleSave() {
    if (!requireLogin(navigate, isLoggedIn, detailsPath)) {
      return;
    }
    try {
      if (saved) {
        await del(`/bookmarks/${id}`, { withUser: true });
        setSaved(false);
      } else {
        await post("/bookmarks", { roomId: id }, { withUser: true });
        setSaved(true);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Open the booking page, after login if needed.
  function handleBook() {
    if (!requireLogin(navigate, isLoggedIn, bookPath)) {
      return;
    }
    navigate(bookPath);
  }

  if (loading) {
    return (
      <section className="page">
        <p className="muted">Loading room...</p>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="page">
        <p className="error">{error || "Room not found"}</p>
        <Link to="/">Back to rooms</Link>
      </section>
    );
  }

  return (
    <section className="page">
      <p className="back-link">
        <Link to="/">← All rooms</Link>
      </p>
      <article className="card room-card details-card">
        <div className="room-accent" />
        <div className="room-body">
          <div className="room-top">
            <h1>{room.name}</h1>
            {!isAdmin && (
              <button
                className={`icon-btn ${saved ? "saved" : ""}`}
                type="button"
                onClick={handleSave}
                aria-label={saved ? "Remove bookmark" : "Save room"}
                title={saved ? "Remove bookmark" : "Save room"}
              >
                {saved ? "♥" : "♡"}
              </button>
            )}
          </div>
          <p>{room.description}</p>
          {room.amenities?.length > 0 && (
            <div className="amenity-list">
              {room.amenities.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          )}
          <p className="price">
            ${room.price} <span>/ night</span>
          </p>
          <p className="muted">
            {room.quantity} rooms of this type
            {room.availableCount !== undefined
              ? ` · ${room.availableCount} available for your dates`
              : ""}
          </p>
          {error && <p className="error">{error}</p>}
          {!isAdmin && (
            <div className="room-actions">
              <button
                className="btn btn-outline"
                type="button"
                onClick={handleSave}
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleBook}
              >
                Book
              </button>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
