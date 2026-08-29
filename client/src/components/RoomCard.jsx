import { Link, useNavigate } from "react-router-dom";
import { requireLogin } from "../auth/requireLogin";

// One room card with price, bookmark, view details, and book actions.
export function RoomCard({ room, saved, isLoggedIn, isAdmin, onToggleSave, dates }) {
  const navigate = useNavigate();
  const detailsPath = dates
    ? `/rooms/${room._id}?checkIn=${dates.checkIn}&checkOut=${dates.checkOut}`
    : `/rooms/${room._id}`;
  const bookPath = `/book?roomId=${room._id}`;

  // Bookmark or unbookmark, after login if needed.
  function handleSave() {
    if (!requireLogin(navigate, isLoggedIn, "/")) {
      return;
    }
    onToggleSave(room);
  }

  // Open the booking page, after login if needed.
  function handleBook() {
    if (!requireLogin(navigate, isLoggedIn, bookPath)) {
      return;
    }
    navigate(bookPath);
  }

  return (
    <article className="card room-card">
      <div className="room-accent" />
      <div className="room-body">
        <div className="room-top">
          <h2>{room.name}</h2>
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
        <p className="muted">{room.description}</p>
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
        {room.availableCount !== undefined && (
          <p className="muted">{room.availableCount} available for your dates</p>
        )}
        <div className="room-actions">
          <Link className="btn btn-outline" to={detailsPath}>
            View Details
          </Link>
          {!isAdmin && (
            <button className="btn btn-primary" type="button" onClick={handleBook}>
              Book
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
