// Small popup that confirms a successful booking.
export function SuccessModal({ message, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <h2>Booking successful!</h2>
        <p className="muted">{message}</p>
        <button className="btn btn-primary" type="button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
