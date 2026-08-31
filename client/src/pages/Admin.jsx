import { useEffect, useState } from "react";
import { del, get, post, put } from "../api/client";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  quantity: "",
  amenities: "",
};

const emptyBookingForm = {
  checkIn: "",
  checkOut: "",
};

// Turn a comma-separated amenities string into an array.
function parseAmenities(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Fill the form from an existing room.
function formFromRoom(room) {
  return {
    name: room.name,
    description: room.description || "",
    price: String(room.price),
    quantity: String(room.quantity),
    amenities: (room.amenities || []).join(", "),
  };
}

// Format an ISO date string for display.
function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString();
}

// Format an ISO date string for a date input's value (YYYY-MM-DD).
function toDateInputValue(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toISOString().slice(0, 10);
}

// Fill the booking edit form from an existing booking.
function bookingFormFromBooking(booking) {
  return {
    checkIn: toDateInputValue(booking.checkIn),
    checkOut: toDateInputValue(booking.checkOut),
  };
}

// Admin room and booking management.
export function Admin() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState("");
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingBusy, setBookingBusy] = useState(false);

  // Load rooms and bookings when the page opens.
  useEffect(() => {
    loadRooms();
    loadBookings();
  }, []);

  // Fetch all rooms for the table.
  async function loadRooms() {
    try {
      setRooms(await get("/rooms"));
    } catch (err) {
      setError(err.message);
    }
  }

  // Fetch every customer booking with room and customer details.
  async function loadBookings() {
    setBookingsLoading(true);
    setBookingsError("");
    try {
      setBookings(await get("/bookings/admin", { withUser: true }));
    } catch (err) {
      setBookingsError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }

  // Start editing a booking's dates in the form.
  function handleEditBooking(booking) {
    setEditingBookingId(booking._id);
    setBookingForm(bookingFormFromBooking(booking));
    setBookingsError("");
  }

  // Clear the booking form and stop editing.
  function handleCancelBookingEdit() {
    setEditingBookingId(null);
    setBookingForm(emptyBookingForm);
  }

  // Keep a booking form field in sync with typing.
  function handleBookingFormChange(event) {
    const { name, value } = event.target;
    setBookingForm({ ...bookingForm, [name]: value });
  }

  // Save the edited check-in/check-out dates for a booking.
  async function handleSubmitBookingEdit(event) {
    event.preventDefault();
    setBookingsError("");
    setBookingBusy(true);
    try {
      await put(
        `/bookings/${editingBookingId}`,
        { checkIn: bookingForm.checkIn, checkOut: bookingForm.checkOut },
        { withUser: true }
      );
      handleCancelBookingEdit();
      await loadBookings();
    } catch (err) {
      setBookingsError(err.message);
    } finally {
      setBookingBusy(false);
    }
  }

  // Delete a booking after a simple confirm.
  async function handleDeleteBooking(booking) {
    const label = booking.room ? booking.room.name : "this room";
    if (!window.confirm(`Remove the booking for "${label}"?`)) {
      return;
    }
    try {
      await del(`/bookings/${booking._id}`, { withUser: true });
      if (editingBookingId === booking._id) {
        handleCancelBookingEdit();
      }
      setBookings(bookings.filter((item) => item._id !== booking._id));
    } catch (err) {
      setBookingsError(err.message);
    }
  }

  // Keep a room form field in sync with typing.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  // Start editing a room in the form.
  function handleEdit(room) {
    setEditingId(room._id);
    setForm(formFromRoom(room));
    setError("");
  }

  // Clear the form and stop editing.
  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  // Create or update a room.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      quantity: Number(form.quantity),
      amenities: parseAmenities(form.amenities),
    };
    try {
      if (editingId) {
        await put(`/rooms/${editingId}`, payload, { withUser: true });
      } else {
        await post("/rooms", payload, { withUser: true });
      }
      handleCancel();
      await loadRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Delete a room after a simple confirm.
  async function handleDelete(room) {
    if (!window.confirm(`Delete "${room.name}"?`)) {
      return;
    }
    try {
      await del(`/rooms/${room._id}`, { withUser: true });
      if (editingId === room._id) {
        handleCancel();
      }
      await loadRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="card hero-card">
        <h1>Manage rooms</h1>
        <p className="muted">Add rooms, change prices, or remove rooms. Customers are not managed here.</p>
      </div>

      <div className="card admin-form">
        <h2>{editingId ? "Edit room" : "Add a room"}</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
          </label>
          <div className="form-row">
            <label>
              Price per night
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required />
            </label>
          </div>
          <label>
            Amenities (comma separated)
            <input name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, TV, Minibar" />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="room-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Saving..." : editingId ? "Save changes" : "Add room"}
            </button>
            {editingId && (
              <button className="btn btn-outline" type="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card table-card">
        <h2>All rooms</h2>
        {rooms.length === 0 && <p className="muted">No rooms yet.</p>}
        {rooms.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id}>
                  <td>{room.name}</td>
                  <td>${room.price}</td>
                  <td>{room.quantity}</td>
                  <td className="table-actions">
                    <button className="btn btn-outline" type="button" onClick={() => handleEdit(room)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => handleDelete(room)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingBookingId && (
        <div className="card admin-form">
          <h2>Edit booking</h2>
          <form className="form" onSubmit={handleSubmitBookingEdit}>
            <div className="form-row">
              <label>
                Check-in
                <input
                  name="checkIn"
                  type="date"
                  value={bookingForm.checkIn}
                  onChange={handleBookingFormChange}
                  required
                />
              </label>
              <label>
                Check-out
                <input
                  name="checkOut"
                  type="date"
                  value={bookingForm.checkOut}
                  onChange={handleBookingFormChange}
                  required
                />
              </label>
            </div>
            {bookingsError && <p className="error">{bookingsError}</p>}
            <div className="room-actions">
              <button className="btn btn-primary" type="submit" disabled={bookingBusy}>
                {bookingBusy ? "Saving..." : "Save changes"}
              </button>
              <button className="btn btn-outline" type="button" onClick={handleCancelBookingEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-card">
        <h2>All customer bookings</h2>
        {!editingBookingId && bookingsError && <p className="error">{bookingsError}</p>}
        {bookingsLoading && <p className="muted">Loading bookings...</p>}
        {!bookingsLoading && bookings.length === 0 && <p className="muted">No bookings yet.</p>}
        {bookings.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    {booking.customer ? booking.customer.name : "Unknown"}
                    <br />
                    <span className="muted">{booking.customer ? booking.customer.email : ""}</span>
                  </td>
                  <td>{booking.room ? booking.room.name : "Deleted room"}</td>
                  <td>{formatDate(booking.checkIn)}</td>
                  <td>{formatDate(booking.checkOut)}</td>
                  <td className="table-actions">
                    <button className="btn btn-outline" type="button" onClick={() => handleEditBooking(booking)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => handleDeleteBooking(booking)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}