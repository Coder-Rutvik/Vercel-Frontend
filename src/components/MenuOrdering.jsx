import React, { useState, useEffect } from 'react';
import { restaurantApi, hotelApi } from '../api/config';
import './MenuOrdering.css';

const MenuOrdering = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuRes = await restaurantApi.getMenu();
        if (menuRes.success) {
          setMenuItems(menuRes.data.length > 0 ? menuRes.data : initialDummyMenu);
        }

        const bookingsRes = await hotelApi.getMyBookings();
        if (bookingsRes.success) {
          // Filter to only confirmed bookings
          const activeBookings = bookingsRes.data.filter(b => b.status === 'confirmed');
          setMyBookings(activeBookings);
          if (activeBookings.length > 0) {
            setSelectedBookingId(activeBookings[0].bookingId);
          }
        }
      } catch (err) {
        console.error(err);
        setMenuItems(initialDummyMenu); // Fallback if DB is empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Temporary Dummy Menu if none in DB
  const initialDummyMenu = [
    { id: '1', name: 'Paneer Butter Masala', category: 'Indian', price: 250, type: 'veg' },
    { id: '2', name: 'Chicken Tikka', category: 'Indian', price: 350, type: 'non-veg' },
    { id: '3', name: 'Hakka Noodles', category: 'Chinese', price: 180, type: 'veg' },
    { id: '4', name: 'Margherita Pizza', category: 'Italian', price: 300, type: 'veg' },
  ];

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const totalCartPrice = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!selectedBookingId) {
      alert("Please select your room booking to charge the food to!");
      return;
    }

    try {
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const res = await restaurantApi.createOrder({
        bookingId: selectedBookingId,
        items: orderItems
      });

      if (res.success) {
        setMessage('✅ Food Order sent to Kitchen! It will be added to your room bill.');
        setCart([]);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setMessage('❌ Failed to place order');
    }
  };

  if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Menu...</div>;

  return (
    <div className="menu-ordering-container">
      <div className="menu-section">
        <h2>🍽️ Restaurant Menu</h2>
        {message && <div className="menu-alert">{message}</div>}

        <div className="menu-grid">
          {menuItems.map(item => (
            <div key={item.id || item.name} className="menu-item-card">
              <span className={`veg-badge ${item.type === 'veg' ? 'veg' : 'non-veg'}`}></span>
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>₹{item.price}</p>
                <small className="category-label">{item.category}</small>
              </div>
              <button onClick={() => addToCart(item)} className="add-btn">Add +</button>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-section">
        <h3>🛒 Your Cart (KOT)</h3>
        
        <div className="room-selector">
          <label>Assign to Room/Booking:</label>
          <select 
            value={selectedBookingId} 
            onChange={(e) => setSelectedBookingId(e.target.value)}
          >
            <option value="">-- Select Room Booking --</option>
            {myBookings.map(b => (
              <option key={b.bookingId} value={b.bookingId}>
                Rooms: {b.rooms.join(', ')} (Booking: {b.bookingId.substring(0,5)})
              </option>
            ))}
          </select>
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">Cart is empty</p>
        ) : (
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <span>{item.name} x {item.quantity}</span>
                  <strong>₹{item.price * item.quantity}</strong>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="remove-btn">🗑️</button>
              </div>
            ))}
            <div className="cart-total">
              <span>Total Food Bill:</span>
              <span>₹{totalCartPrice}</span>
            </div>
            
            <button onClick={placeOrder} className="place-order-btn">
              Place Order to Kitchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuOrdering;
