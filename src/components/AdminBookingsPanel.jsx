import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/config';
import './AdminBookingsPanel.css';

const fmtDate = (v) => {
  if (v == null) return '—';
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const AdminBookingsPanel = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getAllBookings();
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
      } else {
        setRows([]);
        setError(res?.message || 'No data');
      }
    } catch (e) {
      setRows([]);
      setError(e.message || 'Failed to load bookings (admin only).');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="admin-bookings admin-bookings--loading">Loading all bookings…</div>;
  }

  if (error) {
    return (
      <div className="admin-bookings admin-bookings--error">
        <p>{error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-bookings">
      <div className="admin-bookings__head">
        <h2>All bookings (admin)</h2>
        <button type="button" className="admin-bookings__refresh" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="admin-bookings__hint">
        Every reservation in the system. Guest name and email come from the user account linked to each booking.
      </p>

      {rows.length === 0 ? (
        <p className="admin-bookings__empty">No bookings yet.</p>
      ) : (
        <div className="admin-bookings__wrap">
          <table className="admin-bookings__table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Email</th>
                <th>Rooms</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.bookingId}>
                  <td>{b.user?.name || '—'}</td>
                  <td>{b.user?.email || '—'}</td>
                  <td>{Array.isArray(b.rooms) ? b.rooms.join(', ') : '—'}</td>
                  <td>{fmtDate(b.checkInDate)}</td>
                  <td>{fmtDate(b.checkOutDate)}</td>
                  <td>
                    <span className={`admin-pill admin-pill--${b.status}`}>{b.status}</span>
                  </td>
                  <td>{b.totalPrice != null ? Number(b.totalPrice).toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPanel;
