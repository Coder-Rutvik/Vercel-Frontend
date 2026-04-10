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
  const [billError, setBillError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
      setBillError('');
      const res = await billingApi.getCombinedBill(bookingId);
      if (res.success && res.data) {
        setBillData(res.data);
      } else {
        setBillError(res?.message || 'Could not load invoice.');
      }
    } catch (err) {
      setBillError(err.message || 'Failed to load bill. Check that the API is running and you are logged in.');
    }
  };

  const handleCheckout = async () => {
    if (!billData) return;
    try {
      const res = await billingApi.payCheckout(selectedBooking, paymentMode);
      if (res.success) {
        const earned = Number(res?.data?.loyaltyPointsEarned || 0);
        setCheckoutMessage(
          `✅ Checkout Complete! Invoice Paid.${earned > 0 ? ` Loyalty points added: +${earned}` : ''}`
        );
        setBillData(prev => ({...prev, bill: res?.data?.bill || prev?.bill}));
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

  const handleDownloadPdf = async () => {
    if (!selectedBooking) {
      setCheckoutMessage('❌ Select a booking first to download invoice PDF.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const blob = await billingApi.downloadInvoicePdf(selectedBooking);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${String(selectedBooking).slice(0, 8)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setCheckoutMessage('✅ Invoice PDF downloaded.');
    } catch (err) {
      setCheckoutMessage('❌ ' + (err.message || 'PDF download failed'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Billing...</div>;

  return (
    <div className="billing-dashboard">
      <h2>🧾 Checkout &amp; billing</h2>
      <p className="ops-panel-hint billing-dashboard__hint">
        Select a <strong>confirmed</strong> booking, review room + food on one invoice, then pay to check out. Totals feed into <strong>P&amp;L</strong> after payment.
      </p>

      {billError && (
        <div className="billing-error-banner" role="alert">
          {billError}
        </div>
      )}

      <div className="billing-selector">
        <label>Select Room Booking to Checkout:</label>
        <select 
          value={selectedBooking || ''} 
          onChange={(e) => {
            const v = e.target.value;
            setSelectedBooking(v || null);
            setBillError('');
            if (v) loadBill(v);
            else {
              setBillData(null);
            }
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
        <div className="invoice-container" id="printable-invoice">
          <div className="invoice-header">
            <h3>Hotel Reservation Invoice</h3>
            <div className="invoice-header__meta">
              <p>Booking Ref: {billData.booking.bookingId.split('-')[0].toUpperCase()}</p>
              <div className="billing-actions">
                <button type="button" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                  {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                </button>
                <button type="button" onClick={handlePrint}>Print</button>
              </div>
            </div>
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
              {billData.orders && billData.orders.map((order) => (
                <React.Fragment key={order.orderId}>
                  <tr className="sub-row" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <td colSpan="2" style={{ fontSize: '12px', color: '#888', paddingTop: '10px' }}>
                      KOT Order #{order.orderId.substring(0,6)}
                    </td>
                  </tr>
                  {order.items.map((item, itemIdx) => (
                    <tr key={`${order.orderId}-${itemIdx}`} className="sub-row">
                      <td style={{ paddingLeft: '20px', fontSize: '14px', color: '#ccc' }}>
                        🍽️ {item.name} (x{item.quantity})
                        {item.notes && <span style={{display: 'block', fontSize: '11px', color: '#ffb347'}}>📝 {item.notes}</span>}
                      </td>
                      <td style={{ fontSize: '14px', color: '#ccc' }}>
                        ₹{(parseFloat(item.price) * parseInt(item.quantity || 1)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
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
