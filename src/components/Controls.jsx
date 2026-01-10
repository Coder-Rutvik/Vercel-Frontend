import React from 'react';

const Controls = ({ 
  numRooms, 
  setNumRooms, 
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  onBook, 
  onRandom, 
  onReset, 
  travelTime, 
  bookedRooms,
  loading 
}) => {
  // ✅ FIX: Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // ✅ FIX: Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  // ✅ FIX: Calculate minimum check-out date
  const getMinCheckOut = () => {
    if (!checkInDate) return tomorrowStr;
    
    const checkIn = new Date(checkInDate);
    const minCheckOut = new Date(checkIn);
    minCheckOut.setDate(minCheckOut.getDate() + 1);
    return minCheckOut.toISOString().split('T')[0];
  };
  
  const minCheckOutDate = getMinCheckOut();

  // ✅ FIX: Handle check-in date change
  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    setCheckInDate(newCheckIn);
    
    // Auto-adjust check-out if it's before or same as new check-in
    if (checkOutDate <= newCheckIn) {
      const checkIn = new Date(newCheckIn);
      const nextDay = new Date(checkIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay.toISOString().split('T')[0]);
    }
  };

  // ✅ FIX: Handle check-out date change
  const handleCheckOutChange = (e) => {
    setCheckOutDate(e.target.value);
  };

  // ✅ FIX: Calculate stay duration
  const calculateStayDuration = () => {
    if (!checkInDate || !checkOutDate) return 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="controls">
      <div className="pdf-layout">
        <div className="pdf-control-row">
          <div className="pdf-control-group">
            <label className="pdf-label">No of Rooms</label>
            <input
              type="number"
              min="1"
              max="5"
              value={numRooms}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setNumRooms(Math.max(1, Math.min(5, value)));
              }}
              className="pdf-input"
              disabled={loading}
            />
            <small className="pdf-hint">(1-5 rooms)</small>
          </div>
          
          <div className="pdf-control-group">
            <label className="pdf-label">Check-in Date</label>
            <input
              type="date"
              value={checkInDate}
              onChange={handleCheckInChange}
              min={todayStr}
              className="pdf-input"
              disabled={loading}
            />
            <small className="pdf-hint">Min: Today</small>
          </div>
          
          <div className="pdf-control-group">
            <label className="pdf-label">Check-out Date</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={handleCheckOutChange}
              min={minCheckOutDate}
              className="pdf-input"
              disabled={loading}
            />
            <small className="pdf-hint">Min: Day after check-in</small>
          </div>
          
          <div className="pdf-buttons">
            <button 
              onClick={onBook} 
              className="pdf-btn book-btn"
              disabled={loading || !checkInDate || !checkOutDate}
            >
              {loading ? 'Booking...' : 'Book'}
            </button>
            <button onClick={onRandom} className="pdf-btn random-btn" disabled={loading}>
              Random
            </button>
            <button onClick={onReset} className="pdf-btn reset-btn" disabled={loading}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ✅ FIX: Date Validation Warning */}
      <div className="date-validation">
        {checkInDate && checkOutDate && (
          <div className="validation-message">
            {new Date(checkInDate) < today ? (
              <p className="error">⚠️ Check-in date cannot be in the past</p>
            ) : new Date(checkOutDate) <= new Date(checkInDate) ? (
              <p className="error">⚠️ Check-out must be after check-in</p>
            ) : (
              <p className="success">✅ Dates are valid</p>
            )}
          </div>
        )}
      </div>

      <div className="booking-info">
        <h3>📊 Booking Information:</h3>
        
        {checkInDate && checkOutDate && (
          <>
            <p><strong>Stay Duration:</strong> {calculateStayDuration()} night(s)</p>
            <p><strong>Dates:</strong> {new Date(checkInDate).toLocaleDateString()} to {new Date(checkOutDate).toLocaleDateString()}</p>
          </>
        )}
        
        {travelTime > 0 && (
          <p><strong>Travel Time:</strong> <span className="travel-time">{travelTime} minutes</span></p>
        )}
        
        {bookedRooms.length > 0 && (
          <>
            <p><strong>Booked Rooms:</strong> <span className="booked-rooms">{bookedRooms.join(', ')}</span></p>
            <p className="selection-note">Selected rooms highlight for 3 seconds</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;