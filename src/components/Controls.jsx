import React from 'react';

const Controls = ({
  numRooms, setNumRooms,
  checkInDate, setCheckInDate,
  checkOutDate, setCheckOutDate,
  onBook, onRandom, onReset,
  loading
}) => {
  return (
    <div className="controls">
      <div className="controls-grid">
        <div className="input-group">
          <label>No of Rooms</label>
          <input
            type="number" min="1" max="5" value={numRooms}
            onChange={(e) => setNumRooms(parseInt(e.target.value) || 1)}
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <label>Check-in</label>
          <input
            type="date" value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <label>Check-out</label>
          <input
            type="date" value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-green" onClick={onBook} disabled={loading}>
          Book
        </button>
        <button className="btn btn-green" onClick={onRandom} disabled={loading}>
          Random
        </button>
        <button className="btn btn-reset" onClick={onReset} disabled={loading}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default Controls;
