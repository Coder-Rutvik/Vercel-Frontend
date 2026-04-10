import React, { useState, useEffect, useCallback } from 'react';
import { restaurantApi } from '../api/config';
import './CustomerQrMenu.css';

function getInitialTableNumber() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('table');
    if (fromUrl != null && String(fromUrl).trim() !== '') {
      return String(fromUrl).trim();
    }
  } catch {
    /* ignore */
  }
  try {
    const saved = localStorage.getItem('hotelQrTable');
    if (saved != null && String(saved).trim() !== '') return String(saved).trim();
  } catch {
    /* ignore */
  }
  return '1';
}

const CustomerQrMenu = () => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState(getInitialTableNumber);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [menuError, setMenuError] = useState('');

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setMenuError('');
    try {
      const res = await restaurantApi.getMenu();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setMenu(res.data);
      } else {
        setMenu([]);
        setMenuError('Menu is empty or API error. Click Retry or start the backend.');
      }
    } catch (err) {
      setMenu([]);
      setMenuError(err.message || 'Could not load menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    try {
      if (tableNumber) localStorage.setItem('hotelQrTable', String(tableNumber));
    } catch {
      /* ignore */
    }
  }, [tableNumber]);

  const addToCart = (item) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === item.id || i.name === item.name);
      if (exist) {
        return prev.map((i) =>
          i.id === item.id || i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (name) => {
    setCart((prev) => prev.filter((i) => i.name !== name));
  };

  const placeOrder = async () => {
    const table = String(tableNumber || '').trim() || '1';
    if (cart.length === 0) {
      setMessage('❌ Your cart is empty.');
      return;
    }

    try {
      const orderItems = cart.map((item) => ({
        menuItemId: item.id || null,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const res = await restaurantApi.createOrder({
        tableNumber: table,
        items: orderItems,
        bookingId: null
      });

      if (res.success) {
        setMessage('✅ Order sent to the kitchen.');
        setCart([]);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ ' + (res.message || 'Order failed'));
      }
    } catch (err) {
      setMessage('❌ ' + (err.message || 'Order failed — log in and ensure the API is running.'));
    }
  };

  if (loading) {
    return <div className="qr-loading">Loading menu…</div>;
  }

  return (
    <div className="qr-container">
      <div className="qr-header">
        <h1>📱 QR menu (demo)</h1>
        <p>
          Table defaults to <strong>1</strong> (or use <code>?table=5</code> in the URL). You must be{' '}
          <strong>logged in</strong> for the kitchen to receive a real order.
        </p>
      </div>

      {message && <div className="qr-alert">{message}</div>}

      {menuError && (
        <div className="qr-menu-error">
          <span>{menuError}</span>
          <button type="button" onClick={loadMenu}>
            Retry
          </button>
        </div>
      )}

      <div className="qr-body">
        <div className="qr-table-input">
          <label htmlFor="qr-table">Table number</label>
          <input
            id="qr-table"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 5"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />
          <small className="qr-table-hint">Tip: bookmark this page with <code>?table=YOUR_TABLE</code></small>
        </div>

        <div className="qr-menu-list">
          {menu.map((item) => (
            <div key={item.id || item.name} className="qr-menu-item">
              <div className="item-info">
                <h4>
                  <span className={`veg-dot ${item.type}`} /> {item.name}
                </h4>
                <p className="price">₹{parseFloat(item.price).toFixed(2)}</p>
                <small>{item.category}</small>
              </div>
              <button type="button" className="btn-add" onClick={() => addToCart(item)}>
                ADD
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="qr-cart-floating">
            <div className="cart-summary">
              <span>{cart.length} items</span>
              <strong>
                ₹{cart.reduce((a, c) => a + parseFloat(c.price) * c.quantity, 0).toFixed(2)}
              </strong>
            </div>

            <div className="cart-details">
              {cart.map((c, i) => (
                <div key={i} className="cart-row">
                  <span>
                    {c.quantity}× {c.name}
                  </span>
                  <button type="button" onClick={() => removeFromCart(c.name)}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={placeOrder} className="btn-place-order">
              Send to kitchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerQrMenu;
