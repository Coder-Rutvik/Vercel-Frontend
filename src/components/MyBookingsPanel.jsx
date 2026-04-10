import React, { useState, useEffect, useCallback } from 'react';
import { hotelApi } from '../api/config';
import './MyBookingsPanel.css';

const formatDate = (value) => {
  if (value == null) return '—';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s.slice(0, 10);
};

const roomsLabel = (rooms) => {
  if (!Array.isArray(rooms)) return '—';
  return rooms.map((r) => (r != null && typeof r === 'object' ? r.roomNumber : r)).join(', ');
};

const MyBookingsPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [listRes, statsRes] = await Promise.all([
        hotelApi.getMyBookings(),
        hotelApi.getBookingStats().catch(() => null),
      ]);
      if (listRes.success && Array.isArray(listRes.data)) {
        setBookings(listRes.data);
      } else {
        setBookings([]);
      }
      if (statsRes && statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(null);
      }
    } catch (e) {
      setMessage('❌ ' + (e.message || 'Could not load bookings'));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking? Room charges may still apply per hotel policy (demo).')) return;
    setCancellingId(bookingId);
    setMessage('');
    try {
      const res = await hotelApi.cancelBooking(bookingId);
      if (res.success) {
        setMessage('✅ ' + (res.message || 'Booking cancelled.'));
        await load();
      }
    } catch (e) {
      setMessage('❌ ' + (e.message || 'Cancel failed'));
    } finally {
      setCancellingId(null);
    }
  };

  const todayUtcMidnight = () => {
    const d = new Date();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  const canCancel = (b) => {
    if (b.status !== 'confirmed') return false;
    const s = String(b.checkInDate || '');
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return false;
    const checkInMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return checkInMs >= todayUtcMidnight();
  };

  if (loading) {
    return <div className="my-bookings my-bookings--loading">Loading your bookings…</div>;
  }

  return (
    <div className="my-bookings">
      <div className="my-bookings__head">
        <h2>📋 My bookings</h2>
        <button type="button" className="my-bookings__refresh" onClick={load}>
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={
            'my-bookings__banner ' +
            (message.includes('✅') ? 'my-bookings__banner--ok' : 'my-bookings__banner--err')
          }
        >
          {message}
        </div>
      )}

      {stats && (
        <div className="my-bookings__stats">
          <div className="my-bookings__stat">
            <span className="my-bookings__stat-label">Total</span>
            <span className="my-bookings__stat-value">{stats.total}</span>
          </div>
          <div className="my-bookings__stat">
            <span className="my-bookings__stat-label">Confirmed</span>
            <span className="my-bookings__stat-value">{stats.confirmed}</span>
          </div>
          <div className="my-bookings__stat">
            <span className="my-bookings__stat-label">Upcoming</span>
            <span className="my-bookings__stat-value">{stats.upcoming}</span>
          </div>
          <div className="my-bookings__stat">
            <span className="my-bookings__stat-label">Nights (stayed)</span>
            <span className="my-bookings__stat-value">{stats.totalNights}</span>
          </div>
          <div className="my-bookings__stat my-bookings__stat--wide">
            <span className="my-bookings__stat-label">Total spent (confirmed + completed)</span>
            <span className="my-bookings__stat-value">₹{Number(stats.totalSpent || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="my-bookings__empty">No bookings yet. Use Hotel View to reserve rooms.</p>
      ) : (
        <div className="my-bookings__table-wrap">
          <table className="my-bookings__table">
            <thead>
              <tr>
                <th>Rooms</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.bookingId}>
                  <td>{roomsLabel(b.rooms)}</td>
                  <td>{formatDate(b.checkInDate)}</td>
                  <td>{formatDate(b.checkOutDate)}</td>
                  <td>
                    <span className={'my-bookings__pill my-bookings__pill--' + String(b.status || '')}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.paymentStatus || '—'}</td>
                  <td>₹{parseFloat(b.totalPrice || 0).toFixed(2)}</td>
                  <td>
                    {canCancel(b) ? (
                      <button
                        type="button"
                        className="my-bookings__cancel"
                        disabled={cancellingId === b.bookingId}
                        onClick={() => handleCancel(b.bookingId)}
                      >
                        {cancellingId === b.bookingId ? '…' : 'Cancel'}
                      </button>
                    ) : (
                      <span className="my-bookings__dash">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPanel;
