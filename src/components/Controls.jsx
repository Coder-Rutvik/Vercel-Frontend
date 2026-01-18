import React from 'react';
const Controls = ({
  numRooms, setNumRooms,
  checkInDate, setCheckInDate,
  checkOutDate, setCheckOutDate,
  onBook, onRandom, onReset,
  loading
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
        <button
          className="btn btn-green"
          onClick={() => handleAction('book', onBook)}
          disabled={loading}
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
