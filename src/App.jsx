import React, { useState, useEffect } from 'react';
import HotelVisualization from './components/HotelVisualization';
import Controls from './components/Controls';
import AuthModal from './components/AuthModal';
import KitchenDashboard from './components/KitchenDashboard';
import MenuOrdering from './components/MenuOrdering';
import BillingDashboard from './components/BillingDashboard';
import AccountingDashboard from './components/AccountingDashboard';
import InventoryDashboard from './components/InventoryDashboard';
import CustomerQrMenu from './components/CustomerQrMenu';
import { useAuth } from './context/AuthContext';
import { hotelApi } from './api/config';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('hotel');
  const { user, isAuthenticated, logout } = useAuth();
  const [hotel, setHotel] = useState([]);
  const [numRooms, setNumRooms] = useState(1);
  const [roomType, setRoomType] = useState('Any');
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
    // Initial UI state before fetch
    setHotel([]);
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await hotelApi.getAllRooms();
      if (response.success && Array.isArray(response.data)) {
        const rawRooms = response.data;
        const floorMap = {};

        // Dynamically build SaaS UI matrix grouped by floor from any room count (e.g. 150 rooms)
        rawRooms.forEach(room => {
          if (!floorMap[room.floor]) {
            floorMap[room.floor] = { floorNumber: room.floor, rooms: [] };
          }
          floorMap[room.floor].rooms.push(room);
        });

        const dynamicHotel = Object.values(floorMap).sort((a, b) => a.floorNumber - b.floorNumber);
        
        dynamicHotel.forEach(floor => {
          floor.rooms.sort((a, b) => a.position - b.position);
        });

        setHotel(dynamicHotel);
      }
    } catch (e) { 
      setMessage('❌ DB Error: ' + (e.message || 'Error fetching rooms')); 
      console.error(e);
    }
    finally { setRoomsLoading(false); }
  };

  useEffect(() => {
    fetchRooms();
  }, [isAuthenticated]);

  const handleBook = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setLoading(true); setMessage('');
    try {
      const resp = await hotelApi.bookRooms({ numRooms, checkInDate, checkOutDate, roomType });
      if (resp.success) {
        setBookedRooms(resp.data.rooms.map(r => r.roomNumber));
        const roomList = resp.data.rooms.map(r => `Room ${r.roomNumber} (Floor ${r.floor})`).join(', ');
        setMessage(`✅ Successfully booked: ${roomList} (Total Bill: ₹${resp.data.totalPrice})`);
        await fetchRooms();
        setTimeout(() => setBookedRooms([]), 2000);
      } else setMessage('❌ ' + resp.message);
    } catch (e) { setMessage('❌ Booking failed: ' + (e.message || 'Unknown error')); console.error(e); }
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

        <div className="tabs" style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0', flexWrap: 'wrap' }}>
          <button 
            className={`header-btn ${activeTab === 'hotel' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotel')}
          >
            🏨 Hotel View
          </button>
          <button 
            className={`header-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Order Food
          </button>
          <button 
            className={`header-btn ${activeTab === 'kitchen' ? 'active' : ''}`}
            onClick={() => setActiveTab('kitchen')}
          >
            🧑‍🍳 Kitchen KOT
          </button>
          <button 
            className={`header-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            🧾 Check Out / Billing
          </button>
          <button 
            className={`header-btn ${activeTab === 'accounting' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounting')}
          >
            📊 Accounting P&L
          </button>
          <button 
            className={`header-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory/Stock
          </button>
          <button 
            className={`header-btn ${activeTab === 'qrmenu' ? 'active' : ''}`}
            onClick={() => setActiveTab('qrmenu')}
          >
            📱 QR Scan (Demo)
          </button>
        </div>

        {activeTab === 'hotel' && (
          <>
            <Controls
              numRooms={numRooms} setNumRooms={setNumRooms}
              roomType={roomType} setRoomType={setRoomType}
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
          </>
        )}

        {activeTab === 'kitchen' && <KitchenDashboard />}
        {activeTab === 'menu' && <MenuOrdering />}
        {activeTab === 'billing' && <BillingDashboard />}
        {activeTab === 'accounting' && <AccountingDashboard />}
        {activeTab === 'inventory' && <InventoryDashboard />}
        {activeTab === 'qrmenu' && <CustomerQrMenu />}
      </div>
    </div>
  );
}

export default App;
