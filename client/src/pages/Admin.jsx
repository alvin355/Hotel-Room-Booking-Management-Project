import { useEffect, useState } from "react";
import { del, get, post, put } from "../api/client";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  quantity: "",
  amenities: "",
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

// Admin room management.
export function Admin() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Load rooms when the page opens.
  useEffect(() => {
    loadRooms();
  }, []);

  // Fetch all rooms for the table.
  async function loadRooms() {
    try {
      setRooms(await get("/rooms"));
    } catch (err) {
      setError(err.message);
    }
  }

  // Keep a form field in sync with typing.
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
    </section>
  );
}
