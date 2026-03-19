import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../api/config';
import { io } from 'socket.io-client';
import './KitchenDashboard.css';

// Socket setup based on backend URL
const SOCKET_URL = window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin;

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch active orders from database on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await restaurantApi.getActiveOrders();
        if (response.success) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch active orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Setup Socket.io
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-kitchen');
    });

    newSocket.on('new-order', (order) => {
      setOrders(prev => [...prev, order]);
      // Hidden Gem 11: Play a notification sound
      try {
        const audio = new Audio('https://www.myinstants.com/media/sounds/ding-sound-effect_2.mp3');
        audio.play();
      } catch (e) {
        console.error("Audio block on auto-play");
      }
    });

    newSocket.on('order-updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
    });

    return () => newSocket.close();
  }, []);

  const changeStatus = async (orderId, status) => {
    try {
      await restaurantApi.updateOrderStatus(orderId, status);
      // Socket will update the UI, but we can optimistically update too:
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Kitchen Dashboard...</div>;

  return (
    <div className="kitchen-dashboard">
      <h2>🧑‍🍳 Kitchen Order Ticket (KOT) Dashboard</h2>
      
      <div className="orders-grid">
        {orders.length === 0 ? (
          <div className="no-orders text-light">No active orders right now. Kitchen is clear! ✨</div>
        ) : (
          orders.map(order => (
            <div key={order.orderId} className={`order-card status-${order.status}`}>
              <div className="order-header">
                <h4>Order #{order.orderId.substring(0,6)}</h4>
                <span className={`badge ${order.status}`}>{order.status}</span>
              </div>
              <p className="order-meta">
                {order.tableNumber ? `Table: ${order.tableNumber}` : `Room: ${order.bookingId?.substring(0,6) || 'Walk-in'}`}
              </p>
              
              <ul className="order-items">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    <span>{item.name}</span>
                    <strong>x{item.quantity}</strong>
                  </li>
                ))}
              </ul>
              
              <div className="order-actions">
                {order.status === 'pending' && (
                  <button onClick={() => changeStatus(order.orderId, 'preparing')} className="btn-preparing">Start Preparing</button>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => changeStatus(order.orderId, 'prepared')} className="btn-prepared">Mark Prepared ✅</button>
                )}
                {order.status === 'prepared' && (
                  <button onClick={() => changeStatus(order.orderId, 'delivered')} className="btn-delivered">Order Delivered</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KitchenDashboard;
