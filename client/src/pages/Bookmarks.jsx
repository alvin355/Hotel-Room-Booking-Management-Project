import { useEffect, useState } from "react";
import { del, get } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { RoomCard } from "../components/RoomCard";

// Customer's saved rooms.
export function Bookmarks() {
  const { isLoggedIn, isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load saved rooms on first render.
  useEffect(() => {
    loadSaved();
  }, []);

  // Fetch bookmarked rooms for the logged-in user.
  async function loadSaved() {
    setLoading(true);
    setError("");
    try {
      const list = await get("/bookmarks", { withUser: true });
      setRooms(list.map((item) => item.room).filter(Boolean));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Remove a room from the saved list.
  async function handleToggleSave(room) {
    try {
      await del(`/bookmarks/${room._id}`, { withUser: true });
      setRooms(rooms.filter((item) => item._id !== room._id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="card hero-card">
        <h1>Saved rooms</h1>
        <p className="muted">Rooms you bookmarked so you can view or book them later.</p>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading saved rooms...</p>}
      {!loading && rooms.length === 0 && <p className="muted margin-top">You have not saved any rooms yet.</p>}

      <div className="room-grid margin-top">
        {rooms.map((room) => (
          <RoomCard
            key={room._id}
            room={room}
            saved
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            onToggleSave={handleToggleSave}
          />
        ))}
      </div>
    </section>
  );
}
