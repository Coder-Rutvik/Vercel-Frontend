import React, { useState, useEffect } from 'react';
import HotelVisualization from './components/HotelVisualization';
import Controls from './components/Controls';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { hotelApi } from './api/config';
import { initializeHotel } from './utils/bookingAlgorithm';
import './styles/App.css';

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [hotel, setHotel] = useState([]);
  const [numRooms, setNumRooms] = useState(1);
  const [checkInDate, setCheckInDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  });
  const [bookedRooms, setBookedRooms] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    setHotel(initializeHotel());
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await hotelApi.getAllRooms();
      if (response.success) {
        const updatedHotel = initializeHotel();
        response.data.forEach(room => {
          const fIdx = room.floor - 1;
          if (updatedHotel[fIdx]) {
            const rIdx = updatedHotel[fIdx].rooms.findIndex(r => r.roomNumber === room.roomNumber);
            if (rIdx !== -1) updatedHotel[fIdx].rooms[rIdx].status = room.status;
          }
        });
        setHotel(updatedHotel);
      }
    } catch (e) { setMessage(' Error fetching rooms'); }
    finally { setRoomsLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) fetchRooms();
    else setRoomsLoading(false);
  }, [isAuthenticated]);

  const handleBook = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setLoading(true); setMessage('');
    try {
      const resp = await hotelApi.bookRooms({ numRooms, checkInDate, checkOutDate });
      if (resp.success) {
        setBookedRooms(resp.data.rooms);
        setMessage('✅ Successfully booked rooms!');
        await fetchRooms();
        setTimeout(() => setBookedRooms([]), 2000);
      } else setMessage('❌ ' + resp.message);
    } catch (e) { setMessage('❌ Booking failed'); }
    finally { setLoading(false); }
  };

  const handleRandom = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setLoading(true); setMessage('');
    try {
      const resp = await hotelApi.generateRandomOccupancy();
      if (resp.success) {
        setBookedRooms(resp.data.bookedRooms || []);
        setMessage('🎲 Random occupancy generated!');
        await fetchRooms();
        setTimeout(() => setBookedRooms([]), 2000);
      }
    } catch (e) { setMessage('❌ Random occupancy failed'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setLoading(true); setMessage('');
    try {
      const resp = await hotelApi.resetAllBookings();
      if (resp.success) {
        setBookedRooms([]);
        setMessage('✅ Reset complete!');
        await fetchRooms();
      }
    } catch (e) { setMessage('❌ Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Hotel Room Reservation System</h1>

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <span className="user-info">👤 {user?.name}</span>
              <button onClick={logout} className="header-btn">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="header-btn">Login</button>
          )}
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <div className="container">
        <div className="message-box">
          {message && (
            <p className={"message " + (message.includes('✅') || message.includes('🎲') ? 'success' : 'error')}>
              {message}
            </p>
          )}
        </div>

        <Controls
          numRooms={numRooms} setNumRooms={setNumRooms}
          checkInDate={checkInDate} setCheckInDate={setCheckInDate}
          checkOutDate={checkOutDate} setCheckOutDate={setCheckOutDate}
          onBook={handleBook} onRandom={handleRandom} onReset={handleReset}
          loading={loading || roomsLoading}
        />

        {roomsLoading ? (
          <div style={{ textAlign: 'center', color: 'white', padding: '40px', fontSize: '20px' }}>
            ✨ Polishing the floors...
          </div>
        ) : (
          <HotelVisualization hotel={hotel} bookedRooms={bookedRooms} />
        )}
      </div>
    </div>
  );
}

export default App;
