import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get, post } from "../api/client";
import { SuccessModal } from "../components/SuccessModal";

// Count whole nights between two YYYY-MM-DD dates.
function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return 0;
  }
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// Booking form with room and dates.
export function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(params.get("roomId") || "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [availableCount, setAvailableCount] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const selected = rooms.find((room) => room._id === roomId);
  const nights = nightsBetween(checkIn, checkOut);
  const total = selected && nights > 0 ? selected.price * nights : 0;

  // Load rooms for the dropdown.
  useEffect(() => {
    loadRooms();
  }, []);

  // Refresh availability when the room or dates change.
  useEffect(() => {
    loadAvailability();
  }, [roomId, checkIn, checkOut]);

  // Fetch all rooms so the guest can pick one.
  async function loadRooms() {
    try {
      setRooms(await get("/rooms"));
    } catch (err) {
      setError(err.message);
    }
  }

  // Ask the API how many units of this room are free for the chosen dates.
  async function loadAvailability() {
    if (!roomId || !checkIn || !checkOut || nights <= 0) {
      setAvailableCount(null);
      return;
    }
    try {
      const room = await get(`/rooms/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}`);
      setAvailableCount(room.availableCount);
      setError("");
    } catch (err) {
      setAvailableCount(null);
      setError(err.message);
    }
  }

  // Create the booking and show a success popup.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!roomId || nights <= 0) {
      setError("Choose a room and a check-out date after check-in.");
      return;
    }
    if (availableCount !== null && availableCount <= 0) {
      setError("No rooms available for those dates.");
      return;
    }
    setBusy(true);
    try {
      await post("/bookings", { roomId, checkIn, checkOut }, { withUser: true });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Close the popup and go back to the home page.
  function handleCloseSuccess() {
    setSuccess(false);
    navigate("/");
  }

  return (
    <section className="page auth-page">
      <div className="card">
        <h1>Book a room</h1>
        <p className="muted">Pick a room and the nights you want to stay.</p>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Room
            <select value={roomId} onChange={(event) => setRoomId(event.target.value)} required>
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} — ${room.price}/night
                </option>
              ))}
            </select>
          </label>
          <label>
            Check-in
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required />
          </label>
          <label>
            Check-out
            <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required />
          </label>
          {nights > 0 && selected && (
            <p>
              {nights} night{nights === 1 ? "" : "s"} · total <strong>${total}</strong>
            </p>
          )}
          {availableCount !== null && (
            <p className="muted">
              {availableCount > 0
                ? `${availableCount} available for these dates`
                : "No rooms available for these dates"}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      </div>
      {success && (
        <SuccessModal message="Your booking was saved." onClose={handleCloseSuccess} />
      )}
    </section>
  );
}
