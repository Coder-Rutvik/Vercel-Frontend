import React, { useState, useEffect, useCallback } from 'react';
import { restaurantApi, hotelApi } from '../api/config';
import './MenuOrdering.css';

const MenuOrdering = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setMenuError('');
    setMessage('');

    try {
      const menuRes = await restaurantApi.getMenu();
      if (menuRes && menuRes.success && Array.isArray(menuRes.data) && menuRes.data.length > 0) {
        setMenuItems(menuRes.data);
      } else if (menuRes && menuRes.success && Array.isArray(menuRes.data) && menuRes.data.length === 0) {
        setMenuItems([]);
        setMenuError('Menu returned empty. Click Retry after the API seeds defaults, or restart the backend.');
      } else {
        setMenuItems([]);
        setMenuError(menuRes?.message || 'Could not load menu (unexpected response).');
      }
    } catch (err) {
      setMenuItems([]);
      setMenuError(
        err.message ||
          'Cannot load menu. Run the backend on port 5000 and use npm start (proxy) for the frontend.'
      );
    }

    try {
      const bookingsRes = await hotelApi.getMyBookings();
      if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
        const activeBookings = bookingsRes.data.filter((b) => b.status === 'confirmed');
        setMyBookings(activeBookings);
        setSelectedBookingId((prev) => {
          if (prev && activeBookings.some((b) => b.bookingId === prev)) return prev;
          return activeBookings.length > 0 ? activeBookings[0].bookingId : '';
        });
      }
    } catch {
      setMyBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateNotes = (itemId, notes) => {
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)));
  };

  const totalCartPrice = cart.reduce((acc, curr) => acc + parseFloat(curr.price) * curr.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!selectedBookingId) {
      setMessage('❌ Select your room booking to charge food to the room.');
      return;
    }

    try {
      const orderItems = cart.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || ''
      }));

      const res = await restaurantApi.createOrder({
        bookingId: selectedBookingId,
        items: orderItems
      });

      if (res.success) {
        setMessage('✅ Order sent to kitchen. It will appear on checkout for this booking.');
        setCart([]);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setMessage('❌ ' + (err.message || 'Failed to place order'));
    }
  };

  if (loading) {
    return <div className="menu-ordering-loading">Loading menu…</div>;
  }

  return (
    <div className="menu-ordering-container">
      <div className="menu-section">
        <h2>🍽️ Order food</h2>
        <p className="ops-panel-hint">
          Pick dishes, choose your <strong>confirmed booking</strong>, then send to the kitchen. Items bill at{' '}
          <strong>Checkout / billing</strong>.
        </p>

        {menuError && (
          <div className="menu-error-banner">
            <p>{menuError}</p>
            <button type="button" className="menu-retry-btn" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {message && <div className="menu-alert">{message}</div>}

        {menuItems.length === 0 && !menuError ? (
          <p className="menu-empty">No dishes to show.</p>
        ) : (
          <div className="menu-grid">
            {menuItems.map((item) => (
              <div key={item.id || item.name} className="menu-item-card">
                <span className={`veg-badge ${item.type === 'veg' ? 'veg' : 'non-veg'}`} />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>₹{parseFloat(item.price).toFixed(2)}</p>
                  <small className="category-label">{item.category}</small>
                </div>
                <button type="button" onClick={() => addToCart(item)} className="add-btn">
                  Add +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cart-section">
        <h3>🛒 Your cart (KOT)</h3>

        <div className="room-selector">
          <label>Assign to room booking</label>
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
          >
            <option value="">— Select booking —</option>
            {myBookings.map((b) => (
              <option key={b.bookingId} value={b.bookingId}>
                Rooms: {Array.isArray(b.rooms) ? b.rooms.join(', ') : b.rooms} · Check-in {b.checkInDate}
              </option>
            ))}
          </select>
          {myBookings.length === 0 && (
            <p className="room-selector-hint">Book a room first (Hotel map), then order food.</p>
          )}
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">Cart is empty</p>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <strong>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
                  <input
                    type="text"
                    placeholder="Instructions (e.g. less spicy)"
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    className="cart-notes-input"
                  />
                </div>
                <button type="button" onClick={() => removeFromCart(item.id)} className="remove-btn">
                  🗑️
                </button>
              </div>
            ))}
            <div className="cart-total">
              <span>Food total</span>
              <span>₹{totalCartPrice.toFixed(2)}</span>
            </div>

            <button type="button" onClick={placeOrder} className="place-order-btn">
              Send order to kitchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuOrdering;
