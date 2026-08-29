import { useEffect, useState } from "react";
import { del, get, post } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { RoomCard } from "../components/RoomCard";

// Build the rooms list URL from the current filters.
function roomsUrl(sort, checkIn, checkOut) {
  const params = new URLSearchParams({ sort });
  if (checkIn && checkOut) {
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
  }
  return `/rooms?${params.toString()}`;
}

// Public home page for browsing rooms.
export function Home() {
  const { isLoggedIn, isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [sort, setSort] = useState("asc");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load rooms whenever sort or dates change.
  useEffect(() => {
    loadRooms();
  }, [sort, checkIn, checkOut]);

  // Load this user's saved rooms when logged in.
  useEffect(() => {
    loadSaved();
  }, [isLoggedIn, isAdmin]);

  // Fetch the filtered room list from the API.
  async function loadRooms() {
    setLoading(true);
    setError("");
    try {
      const list = await get(roomsUrl(sort, checkIn, checkOut));
      setRooms(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch bookmark ids so heart icons can show the saved state.
  async function loadSaved() {
    if (!isLoggedIn || isAdmin) {
      setSavedIds([]);
      return;
    }
    try {
      const list = await get("/bookmarks", { withUser: true });
      setSavedIds(list.map((item) => item.roomId));
    } catch (err) {
      setSavedIds([]);
    }
  }

  // Save or unsave a room.
  async function handleToggleSave(room) {
    const alreadySaved = savedIds.includes(room._id);
    try {
      if (alreadySaved) {
        await del(`/bookmarks/${room._id}`, { withUser: true });
        setSavedIds(savedIds.filter((id) => id !== room._id));
      } else {
        await post("/bookmarks", { roomId: room._id }, { withUser: true });
        setSavedIds([...savedIds, room._id]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const dates = checkIn && checkOut ? { checkIn, checkOut } : null;

  return (
    <section className="page">
      <div className="card hero-card">
        <h1>Available rooms</h1>
        <p className="muted">Browse by price or check which rooms are free for your stay.</p>
      </div>

      <div className="card filters">
        <label>
          Check-in
          <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
        </label>
        <label>
          Check-out
          <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
        </label>
        <label>
          Sort by price
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="asc">Low to high</option>
            <option value="desc">High to low</option>
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading rooms...</p>}
      {!loading && rooms.length === 0 && <p className="muted">No rooms match these filters.</p>}

      <div className="room-grid">
        {rooms.map((room) => (
          <RoomCard
            key={room._id}
            room={room}
            saved={savedIds.includes(room._id)}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            onToggleSave={handleToggleSave}
            dates={dates}
          />
        ))}
      </div>
    </section>
  );
}
