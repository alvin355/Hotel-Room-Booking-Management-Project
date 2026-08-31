import { useEffect, useState } from "react";
import { get } from "../api/client";

// Count whole nights between two dates.
function nightsBetween(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}
// Format an ISO date string as something readable.
function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
// Customer's booking history.
export function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Load bookings and rooms on first render.
    useEffect(() => {
        loadBookings();
    }, []);

    // Fetch this user's bookings, then look up each room's details for display.
    async function loadBookings() {
        setLoading(true);
        setError("");
        try {
            const [bookingList, roomList] = await Promise.all([
                get("/bookings", { withUser: true }),
                get("/rooms"),
            ]);
            const roomsById = {};
            roomList.forEach((room) => {
                roomsById[room._id] = room;
            });
            setRooms(roomsById);
            setBookings(
                bookingList.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="page">
            <div className="card hero-card">
                <h1>My bookings</h1>
                <p className="muted">Rooms you have booked, most recent stay first.</p>
            </div>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Loading bookings...</p>}
            {!loading && bookings.length === 0 && (
                <p className="muted margin-top">You have not booked any rooms yet.</p>
            )}

            {!loading && bookings.length > 0 && (
                <div className="card table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Room</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Nights</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => {
                                const room = rooms[booking.roomId];
                                const nights = nightsBetween(booking.checkIn, booking.checkOut);
                                const total = room ? room.price * nights : null;
                                return (
                                    <tr key={booking._id}>
                                        <td>{room ? room.name : "Unknown room"}</td>
                                        <td>{formatDate(booking.checkIn)}</td>
                                        <td>{formatDate(booking.checkOut)}</td>
                                        <td>{nights}</td>
                                        <td>{total !== null ? `$${total}` : "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}