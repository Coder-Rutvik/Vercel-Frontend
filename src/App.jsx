import React, { useState, useEffect, useCallback } from 'react';
import HotelVisualization from './components/HotelVisualization';
import Controls from './components/Controls';
import AuthModal from './components/AuthModal';
import KitchenDashboard from './components/KitchenDashboard';
import MenuOrdering from './components/MenuOrdering';
import BillingDashboard from './components/BillingDashboard';
import AccountingDashboard from './components/AccountingDashboard';
import InventoryDashboard from './components/InventoryDashboard';
import CustomerQrMenu from './components/CustomerQrMenu';
import SmartLift from './components/SmartLift';
import MyBookingsPanel from './components/MyBookingsPanel';
import AdminBookingsPanel from './components/AdminBookingsPanel';
import ProFeaturesPanel from './components/ProFeaturesPanel';
import { useAuth } from './context/AuthContext';
import { hotelApi, getSocketBaseUrl } from './api/config';
import { io } from 'socket.io-client';
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
  const [floorPreference, setFloorPreference] = useState('Any');
  const [manualSelections, setManualSelections] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const canAccessKitchen = isAuthenticated && ['admin', 'manager', 'kitchen'].includes(user?.role);
  const canAccessBackoffice = isAuthenticated && ['admin', 'manager'].includes(user?.role);

  const pushLiveAlert = useCallback((type, text) => {
    const alertId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setLiveAlerts((prev) => {
      const next = [{ id: alertId, type, text }, ...prev];
      return next.slice(0, 5);
    });
    setTimeout(() => {
      setLiveAlerts((prev) => prev.filter((x) => x.id !== alertId));
    }, 6000);
  }, []);

  const playAlertTone = useCallback((frequency = 880, duration = 0.14) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      gainNode.gain.value = 0.03;
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.onended = () => {
        context.close();
      };
    } catch (error) {
      // silent fallback
    }
  }, []);

  const parseDateOnly = (value) => {
    if (!value) return null;
    const str = String(value);
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const datesValid = (() => {
    if (!checkInDate || !checkOutDate) return false;
    const inDt = parseDateOnly(checkInDate);
    const outDt = parseDateOnly(checkOutDate);
    if (!inDt || !outDt) return false;
    return outDt.getTime() > inDt.getTime();
  })();

  const canBook =
    datesValid && (manualSelections.length === 0 || manualSelections.length === numRooms);

  useEffect(() => {
    // Initial UI state before fetch
    setHotel([]);
  }, []);

  // Keep manual selection consistent with current derived availability:
  // - room must be not-booked for selected dates
  // - if Pref. Floor is specific, room must be on that floor
  // - if Pref. Type is specific, room must match type
  useEffect(() => {
    if (!hotel || hotel.length === 0) return;

    const preferredFloor =
      floorPreference === 'Any' || floorPreference === '' || floorPreference == null
        ? null
        : Number(floorPreference);
    const isPreferredFloorValid = preferredFloor == null || !Number.isNaN(preferredFloor);

    if (!isPreferredFloorValid) return;

    const preferredRoomType =
      roomType === 'Any' || roomType === '' || roomType == null ? null : roomType;

    const allowedRoomNumbers = new Set();
    hotel.forEach(f => {
      f.rooms.forEach(r => {
        if (r.status !== 'not-booked') return;
        if (preferredFloor != null && Number(r.floorNumber ?? r.floor) !== preferredFloor) return;
        if (preferredRoomType != null && r.roomType !== preferredRoomType) return;
        allowedRoomNumbers.add(Number(r.roomNumber));
      });
    });

    setManualSelections(prev => prev.filter(roomNo => allowedRoomNumbers.has(Number(roomNo))));
  }, [hotel, floorPreference, roomType]);

  useEffect(() => {
    // If user reduces numRooms after selection, trim safely.
    if (manualSelections.length > numRooms) {
      setManualSelections(prev => prev.slice(0, numRooms));
    }
  }, [numRooms, manualSelections.length]); 

  const fetchRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      const response = await hotelApi.getAllRooms({ checkInDate, checkOutDate });
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
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    fetchRooms();
  }, [isAuthenticated, fetchRooms]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const socket = io(getSocketBaseUrl(), { transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket.emit('join-kitchen'));

    socket.on('booking-created', (payload) => {
      if (!canAccessBackoffice && !canAccessKitchen) return;
      const rooms = Array.isArray(payload?.rooms) ? payload.rooms.join(', ') : 'N/A';
      pushLiveAlert('booking', `New booking received. Rooms: ${rooms}`);
    });

    socket.on('order-ready', (payload) => {
      pushLiveAlert(
        'kitchen',
        `Order ready: #${String(payload?.orderId || '').slice(0, 6).toUpperCase()}`
      );
      playAlertTone(980, 0.16);
    });

    socket.on('low-stock-alert', (payload) => {
      if (!canAccessBackoffice) return;
      const count = Number(payload?.count || 0);
      pushLiveAlert(
        'inventory',
        count > 0 ? `Low stock alert for ${count} item(s).` : 'Low stock alert triggered.'
      );
      playAlertTone(620, 0.2);
    });

    return () => {
      socket.close();
    };
  }, [isAuthenticated, canAccessBackoffice, canAccessKitchen, pushLiveAlert, playAlertTone]);

  const handleBook = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setLoading(true); setMessage('');
    try {
      const preferredFloor =
        floorPreference === 'Any' || floorPreference === '' || floorPreference == null
          ? null
          : Number(floorPreference);

      if (preferredFloor != null && Number.isNaN(preferredFloor)) {
        setMessage('❌ Invalid floor selected. Please select a valid floor.');
        return;
      }

      // If a specific floor is chosen, enforce booking only from that floor (or show message).
      let selectedRoomNumbers = manualSelections;
      if (preferredFloor != null) {
        const preferredFloorObj = hotel.find(f => Number(f.floorNumber) === preferredFloor);
        const preferredFloorRooms = preferredFloorObj?.rooms || [];

        // Validate manual selections belong to preferred floor and are actually available
        if (manualSelections.length > 0) {
          if (manualSelections.length !== numRooms) {
            setMessage(`❌ Please select exactly ${numRooms} rooms on the floor map.`);
            return;
          }

          const invalidFloorRooms = [];
          const alreadyBookedRooms = [];
          const typeMismatchRooms = [];

          const matchesType = (r) => roomType === 'Any' || r.roomType === roomType;

          manualSelections.forEach(roomNo => {
            const room = preferredFloorRooms.find(r => Number(r.roomNumber) === Number(roomNo));
            if (!room) {
              invalidFloorRooms.push(roomNo);
            } else if (!matchesType(room)) {
              typeMismatchRooms.push(roomNo);
            } else if (room.status !== 'not-booked') {
              alreadyBookedRooms.push(roomNo);
            }
          });

          if (invalidFloorRooms.length > 0) {
            setMessage(
              `⚠️ You selected rooms not on Floor ${preferredFloor}: ${invalidFloorRooms.join(
                ', '
              )}. Please select rooms only from Floor ${preferredFloor}.`
            );
            return;
          }

          if (typeMismatchRooms.length > 0) {
            setMessage(
              `⚠️ Selected rooms do not match the selected room type. Please select rooms of type "${roomType}" on Floor ${preferredFloor}.`
            );
            return;
          }

          if (alreadyBookedRooms.length > 0) {
            const availableCountOnFloor = preferredFloorRooms
              .filter(r => r.status === 'not-booked')
              .filter(matchesType).length;

            if (availableCountOnFloor === 0) {
              setMessage(
                `❌ No rooms available on Floor ${preferredFloor}. Please select another floor.`
              );
            } else {
              setMessage(
                `❌ This room is already booked (${alreadyBookedRooms.join(
                  ', '
                )}). Please select another available room.`
              );
            }
            return;
          }
        } else {
          // Auto-pick available rooms from the preferred floor to avoid silent fallback
          const matchesType = (r) => roomType === 'Any' || r.roomType === roomType;
          const availableOnFloor = preferredFloorRooms
            .filter(r => r.status === 'not-booked')
            .filter(matchesType)
            .sort((a, b) => Number(a.position ?? a.roomNumber) - Number(b.position ?? b.roomNumber));

          if (availableOnFloor.length < numRooms) {
            setMessage(
              `❌ No rooms available on Floor ${preferredFloor}. Please select another floor.`
            );
            return;
          }

          selectedRoomNumbers = availableOnFloor.slice(0, numRooms).map(r => r.roomNumber);
          setManualSelections(selectedRoomNumbers);
        }
      }

      const resp = await hotelApi.bookRooms({ 
        numRooms, 
        checkInDate, 
        checkOutDate, 
        roomType, 
        floorPreference: preferredFloor ?? 'Any',
        selectedRoomNumbers
      });
      if (resp.success) {
        const booking = resp.data;
        const roomNumbers = Array.isArray(booking?.rooms)
          ? booking.rooms.map((r) => (r != null && typeof r === 'object' ? r.roomNumber : r)).map(Number)
          : [];
        setBookedRooms(roomNumbers);
        setManualSelections([]);
        setMessage(
          `✅ Successfully booked: Rooms ${roomNumbers.join(', ')} (Total Bill: ₹${booking.totalPrice})`
        );
        await fetchRooms();
        setTimeout(() => setBookedRooms([]), 2000);
      } else {
        // Friendly English messages for preferred-floor scenarios
        if (preferredFloor != null) {
          const msg = String(resp.message || '');

          // Backend returns these message strings:
          // 1) "⚠️ Floor X is FULL!..."
          // 2) "Room Y unavailable!"
          if (msg.toLowerCase().includes('full') || msg.toLowerCase().includes('no rooms available')) {
            setMessage(`❌ No rooms available on Floor ${preferredFloor}. Please select another floor.`);
          } else if (msg.toLowerCase().includes('unavailable')) {
            setMessage(`❌ This room is already booked or became unavailable. Please select another available room or choose a different floor.`);
          } else {
            setMessage('❌ ' + msg);
          }
        } else {
          setMessage('❌ ' + resp.message);
        }
      }
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

  const handleRoomClick = (room) => {
    if (room.status !== 'not-booked') {
      setMessage('❌ This room was already selected by another customer. Please select a different room.');
      return;
    }

    const preferredFloor =
      floorPreference === 'Any' || floorPreference === '' || floorPreference == null
        ? null
        : Number(floorPreference);

    if (preferredFloor != null && Number.isNaN(preferredFloor)) {
      setMessage('❌ Invalid floor selected. Please select a valid floor.');
      return;
    }

    // When a specific floor is chosen, prevent selecting rooms from other floors.
    if (preferredFloor != null && Number(room.floor) !== preferredFloor) {
      setMessage(`⚠️ Please select rooms only from Floor ${preferredFloor}.`);
      return;
    }

    // When a specific room type is chosen, prevent selecting mismatched types.
    if (roomType !== 'Any' && room.roomType !== roomType) {
      setMessage(`⚠️ Please select rooms of type "${roomType}" only.`);
      return;
    }
    
    setManualSelections(prev => {
      // Toggle off if already selected
      if (prev.includes(room.roomNumber)) {
        return prev.filter(n => n !== room.roomNumber);
      }
      
      // Limit to numRooms
      if (prev.length >= numRooms) {
        setMessage(`⚠️ You can only select ${numRooms} rooms at a time for this booking.`);
        return prev;
      }
      
      return [...prev, room.roomNumber];
    });
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
      {liveAlerts.length > 0 && (
        <div className="live-alerts">
          {liveAlerts.map((alert) => (
            <div key={alert.id} className={`live-alert live-alert--${alert.type}`}>
              <span>{alert.text}</span>
              <button
                type="button"
                onClick={() => setLiveAlerts((prev) => prev.filter((x) => x.id !== alert.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="container">
        <div className="message-box">
          {message && (
            <p className={"message " + (message.includes('✅') || message.includes('🎲') ? 'success' : 'error')}>
              {message}
            </p>
          )}
        </div>

        <nav className="ops-nav" aria-label="Hotel operations">
          <div className="ops-nav__block">
            <span className="ops-nav__label">Rooms</span>
            <div className="ops-nav__btns">
              <button
                type="button"
                className={`header-btn ${activeTab === 'hotel' ? 'active' : ''}`}
                onClick={() => setActiveTab('hotel')}
              >
                🏨 Hotel map
              </button>
              <button
                type="button"
                className={`header-btn ${activeTab === 'mybookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('mybookings')}
              >
                📋 My bookings
              </button>
              {user?.role === 'admin' && (
                <button
                  type="button"
                  className={`header-btn ${activeTab === 'adminbookings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('adminbookings')}
                >
                  📒 All bookings
                </button>
              )}
            </div>
          </div>

          <div className="ops-nav__block">
            <span className="ops-nav__label">Food · Kitchen · Billing</span>
            <div className="ops-nav__btns">
              <button
                type="button"
                className={`header-btn ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                🍽️ Order food
              </button>
              <button
                type="button"
                className={`header-btn ${activeTab === 'kitchen' ? 'active' : ''}`}
                onClick={() => setActiveTab('kitchen')}
              >
                🧑‍🍳 Kitchen KOT
              </button>
              <button
                type="button"
                className={`header-btn ${activeTab === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                🧾 Checkout / bill
              </button>
              <button
                type="button"
                className={`header-btn ${activeTab === 'qrmenu' ? 'active' : ''}`}
                onClick={() => setActiveTab('qrmenu')}
              >
                📱 QR menu (demo)
              </button>
            </div>
          </div>

          <div className="ops-nav__block">
            <span className="ops-nav__label">Finance · Stock</span>
            <div className="ops-nav__btns">
              <button
                type="button"
                className={`header-btn ${activeTab === 'accounting' ? 'active' : ''}`}
                onClick={() => setActiveTab('accounting')}
              >
                📊 P&amp;L
              </button>
              <button
                type="button"
                className={`header-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                📦 Stock
              </button>
            </div>
          </div>

          <div className="ops-nav__block">
            <span className="ops-nav__label">Extra</span>
            <div className="ops-nav__btns">
              <button
                type="button"
                className={`header-btn ${activeTab === 'pro' ? 'active' : ''}`}
                onClick={() => setActiveTab('pro')}
              >
                Pro
              </button>
              <button
                type="button"
                className={`header-btn ${activeTab === 'lift' ? 'active' : ''}`}
                onClick={() => setActiveTab('lift')}
              >
                🚀 Smart lift
              </button>
            </div>
          </div>
        </nav>

        {activeTab === 'hotel' && (
          <>
            <Controls
              numRooms={numRooms} setNumRooms={setNumRooms}
              roomType={roomType} setRoomType={setRoomType}
              checkInDate={checkInDate} setCheckInDate={setCheckInDate}
              checkOutDate={checkOutDate} setCheckOutDate={setCheckOutDate}
              floorPreference={floorPreference} setFloorPreference={setFloorPreference}
              onBook={handleBook} onRandom={handleRandom} onReset={handleReset}
              loading={loading || roomsLoading}
              canBook={canBook}
            />

            {roomsLoading ? (
              <div style={{ textAlign: 'center', color: 'white', padding: '40px', fontSize: '20px' }}>
                ✨ Polishing the floors...
              </div>
            ) : (
              <HotelVisualization 
                hotel={hotel} 
                bookedRooms={bookedRooms} 
                manualSelections={manualSelections}
              onRoomClick={handleRoomClick}
              />
            )}
          </>
        )}

        {activeTab === 'kitchen' && (canAccessKitchen ? <KitchenDashboard /> : <div className="message error">Access denied: kitchen role required (kitchen/manager/admin).</div>)}
        {activeTab === 'menu' && <MenuOrdering />}
        {activeTab === 'billing' && (isAuthenticated ? <BillingDashboard /> : <div className="message error">Access denied. Please login to view checkout and billing.</div>)}
        {activeTab === 'accounting' && (canAccessBackoffice ? <AccountingDashboard /> : <div className="message error">Access denied: manager/admin role required for accounting.</div>)}
        {activeTab === 'inventory' && (canAccessBackoffice ? <InventoryDashboard /> : <div className="message error">Access denied: manager/admin role required for inventory.</div>)}
        {activeTab === 'pro' && (canAccessBackoffice ? <ProFeaturesPanel /> : <div className="message error">Access denied: manager/admin role required for PRO features.</div>)}
        {activeTab === 'qrmenu' && <CustomerQrMenu />}
        {activeTab === 'lift' && <SmartLift />}
        {activeTab === 'mybookings' && (
          isAuthenticated ? (
            <MyBookingsPanel />
          ) : (
            <div className="message error">🔒 Please login to view your bookings.</div>
          )
        )}
        {activeTab === 'adminbookings' && (
          isAuthenticated && user?.role === 'admin' ? (
            <AdminBookingsPanel />
          ) : (
            <div className="message error">🔒 Admin only: sign in with an admin account.</div>
          )
        )}
      </div>
    </div>
  );
}

export default App;
