import React from 'react';
const Controls = ({
  numRooms, setNumRooms,
  roomType, setRoomType,
  checkInDate, setCheckInDate,
  checkOutDate, setCheckOutDate,
  floorPreference, setFloorPreference,
  onBook, onRandom, onReset,
  loading,
  canBook = true
}) => {
  const [activeAction, setActiveAction] = React.useState(null);

  React.useEffect(() => {
    if (!loading) setActiveAction(null);
  }, [loading]);

  const handleAction = (action, callback) => {
    setActiveAction(action);
    callback();
  };

  return (
    <div className="controls">
      <div className="controls-grid">
        <div className="input-group">
          <label>No of Rooms</label>
          <input
            type="number"
            min="1"
            max="5"
            value={numRooms}
            onChange={(e) => {
              let val = parseInt(e.target.value);
              if (val > 5) val = 5;
              if (val < 1) val = 1;
              setNumRooms(val);
            }}
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <label>Type</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            disabled={loading}
          >
            <option value="Any">Any Type</option>
            <option value="Standard">Standard (₹1000)</option>
            <option value="Deluxe (AC)">Deluxe AC (₹2000)</option>
            <option value="Suite">Suite (₹4000)</option>
            <option value="Premium">Premium (₹7000)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Check-in</label>
          <input
            type="date" value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            disabled={loading}
            max={checkOutDate || undefined}
          />
        </div>
        <div className="input-group">
          <label>Pref. Floor</label>
          <select 
            value={floorPreference} 
            onChange={(e) => setFloorPreference(e.target.value)}
            disabled={loading}
          >
            <option value="Any">Any Floor</option>
            {[...Array(15)].map((_, i) => (
              <option key={i+1} value={i+1}>Floor {i+1}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Check-out</label>
          <input
            type="date" value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            disabled={loading}
            min={checkInDate || undefined}
          />
        </div>
      </div>

      <p className="controls-guest-hint">
        Guest name, email, and phone come from your <strong>logged-in account</strong> (register / profile). No separate form on this screen.
      </p>

      <div className="button-group">
        <button
          className="btn btn-green"
          onClick={() => handleAction('book', onBook)}
          disabled={loading || !canBook}
        >
          {loading && activeAction === 'book' ? 'Booking...' : 'Book'}
        </button>
        <button
          className="btn btn-green"
          onClick={() => handleAction('random', onRandom)}
          disabled={loading}
        >
          {loading && activeAction === 'random' ? 'Generating...' : 'Random'}
        </button>
        <button
          className="btn btn-reset"
          onClick={() => handleAction('reset', onReset)}
          disabled={loading}
        >
          {loading && activeAction === 'reset' ? 'Resetting...' : 'Reset'}
        </button>
      </div>
    </div>
  );
};

export default Controls;
