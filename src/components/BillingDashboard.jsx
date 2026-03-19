import React, { useState, useEffect } from 'react';
import { hotelApi, billingApi } from '../api/config';
import './BillingDashboard.css';

const BillingDashboard = () => {
  const [myBookings, setMyBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState('upi');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const bookingsRes = await hotelApi.getMyBookings();
      if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
        setMyBookings(bookingsRes.data.filter(b => b.status === 'confirmed'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBill = async (bookingId) => {
    try {
      setBillData(null);
      setCheckoutMessage('');
      const res = await billingApi.getCombinedBill(bookingId);
      if (res.success) {
        setBillData(res.data);
      }
    } catch (err) {
      alert("Failed to load bill");
    }
  };

  const handleCheckout = async () => {
    if (!billData) return;
    try {
      const res = await billingApi.payCheckout(selectedBooking, paymentMode);
      if (res.success) {
        setCheckoutMessage('✅ Checkout Complete! Invoice Paid.');
        setBillData(prev => ({...prev, bill: res.data}));
        setTimeout(() => {
          setSelectedBooking(null);
          setBillData(null);
          fetchBookings(); // refresh active bookings
        }, 3000);
      }
    } catch (err) {
      setCheckoutMessage('❌ Checkout Failed');
    }
  };

  if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Billing...</div>;

  return (
    <div className="billing-dashboard">
      <h2>🧾 Checkout & Billing Invoice</h2>

      <div className="billing-selector">
        <label>Select Room Booking to Checkout:</label>
        <select 
          value={selectedBooking || ''} 
          onChange={(e) => {
            setSelectedBooking(e.target.value);
            if(e.target.value) loadBill(e.target.value);
          }}
        >
          <option value="">-- View My Active Bookings --</option>
          {myBookings.map(b => (
            <option key={b.bookingId} value={b.bookingId}>
              Rooms: {b.rooms.join(', ')} | Check-in: {b.checkInDate}
            </option>
          ))}
        </select>
      </div>

      {checkoutMessage && <div className="checkout-alert">{checkoutMessage}</div>}

      {billData && (
        <div className="invoice-container">
          <div className="invoice-header">
            <h3>Hotel Reservation Invoice</h3>
            <p>Booking Ref: {billData.booking.bookingId.split('-')[0].toUpperCase()}</p>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Rent ({billData.booking.rooms.join(', ')})</td>
                <td>₹{parseFloat(billData.bill.roomTotal).toFixed(2)}</td>
              </tr>
              {billData.orders && billData.orders.map((order, idx) => (
                <tr key={idx} className="sub-row">
                  <td>Food: Order #{order.orderId.substring(0,6)}</td>
                  <td>₹{parseFloat(order.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="summary-row">
                <td>Food Total:</td>
                <td>₹{parseFloat(billData.bill.foodTotal).toFixed(2)}</td>
              </tr>
              <tr className="summary-row">
                <td>Subtotal:</td>
                <td>₹{(parseFloat(billData.bill.roomTotal) + parseFloat(billData.bill.foodTotal)).toFixed(2)}</td>
              </tr>
              <tr className="summary-row tax">
                <td>GST ({billData.bill.gstPercentage}%):</td>
                <td>₹{parseFloat(billData.bill.taxAmount).toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th>Grand Total</th>
                <th>₹{parseFloat(billData.bill.grandTotal).toFixed(2)}</th>
              </tr>
            </tfoot>
          </table>

          {!billData.bill.isPaid ? (
            <div className="payment-section">
              <label>Select Payment Mode:</label>
              <div className="payment-options">
                <label>
                  <input type="radio" value="upi" checked={paymentMode === 'upi'} onChange={e => setPaymentMode(e.target.value)} /> UPI / QR
                </label>
                <label>
                  <input type="radio" value="card" checked={paymentMode === 'card'} onChange={e => setPaymentMode(e.target.value)} /> Credit Card
                </label>
                <label>
                  <input type="radio" value="cash" checked={paymentMode === 'cash'} onChange={e => setPaymentMode(e.target.value)} /> Cash
                </label>
              </div>
              <button onClick={handleCheckout} className="btn-pay">Pay & Checkout</button>
            </div>
          ) : (
             <div className="paid-stamp">PAID via {billData.bill.paymentMode.toUpperCase()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;
