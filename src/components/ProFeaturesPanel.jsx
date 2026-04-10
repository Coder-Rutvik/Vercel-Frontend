import React, { useEffect, useState } from 'react';
import { proApi } from '../api/config';
import './ProFeaturesPanel.css';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const ProFeaturesPanel = () => {
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    source: 'Booking.com',
    externalBookingId: '',
    guestName: '',
    guestEmail: '',
    roomType: 'Any',
    totalRooms: 1,
    checkIn: today(),
    checkOut: tomorrow()
  });

  const loadAIDemand = async () => {
    setLoading(true);
    setAiError('');
    try {
      const res = await proApi.getAIDemand();
      if (res.success) setAiData(res.data);
      else setAiError(res?.message || 'AI demand API failed');
    } catch (error) {
      setAiError(error.message || 'Failed to load AI demand');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIDemand();
  }, []);

  const handleSync = async (e) => {
    e.preventDefault();
    setSyncMessage('');
    setSyncing(true);
    try {
      const payload = {
        ...form,
        totalRooms: Number(form.totalRooms)
      };
      const res = await proApi.channelSync(payload);
      if (res.success) {
        setSyncMessage(`SUCCESS: ${res.message}`);
        await loadAIDemand();
      } else {
        setSyncMessage(`ERROR: ${res?.message || 'Sync failed'}`);
      }
    } catch (error) {
      setSyncMessage(`ERROR: ${error.message || 'Sync failed'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="pro-panel">
      <h2>PRO Features</h2>
      <p className="pro-panel__lead">AI demand prediction and channel-manager webhook sync.</p>

      <div className="pro-card">
        <div className="pro-card__head">
          <h3>AI Demand Prediction</h3>
          <button type="button" onClick={loadAIDemand} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {aiError && <div className="pro-error">{aiError}</div>}
        {aiData && !aiError && (
          <div className="pro-ai-grid">
            <div><strong>Date:</strong> {aiData.activeDate}</div>
            <div><strong>Occupancy:</strong> {aiData.currentOccupancy}</div>
            <div><strong>Occupied:</strong> {aiData.occupiedRooms}/{aiData.totalRooms}</div>
            <div><strong>Multiplier:</strong> {aiData.recommendedPriceMultiplier}x</div>
            <div className="pro-ai-note"><strong>Suggestion:</strong> {aiData.aiSuggestion}</div>
          </div>
        )}
      </div>

      <div className="pro-card">
        <h3>Channel Manager Sync (Demo)</h3>
        <form className="pro-form" onSubmit={handleSync}>
          <input
            type="text"
            placeholder="Source (Booking.com / Airbnb)"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="External Booking ID"
            value={form.externalBookingId}
            onChange={(e) => setForm({ ...form, externalBookingId: e.target.value })}
          />
          <input
            type="text"
            placeholder="Guest name"
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
          />
          <input
            type="email"
            placeholder="Guest email (optional)"
            value={form.guestEmail}
            onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
          />
          <select
            value={form.roomType}
            onChange={(e) => setForm({ ...form, roomType: e.target.value })}
          >
            <option value="Any">Any Type</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe (AC)">Deluxe (AC)</option>
            <option value="Suite">Suite</option>
            <option value="Premium">Premium</option>
          </select>
          <input
            type="number"
            min="1"
            max="5"
            value={form.totalRooms}
            onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
          />
          <input
            type="date"
            value={form.checkIn}
            onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.checkOut}
            onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
            required
          />
          <button type="submit" disabled={syncing}>
            {syncing ? 'Syncing...' : 'Push Sync'}
          </button>
        </form>
        {syncMessage && (
          <div className={syncMessage.startsWith('SUCCESS:') ? 'pro-success' : 'pro-error'}>
            {syncMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProFeaturesPanel;
