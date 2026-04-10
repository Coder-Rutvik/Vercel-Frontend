import React, { useState, useEffect, useMemo } from 'react';
import { inventoryApi } from '../api/config';
import './InventoryDashboard.css';

const QUICK_PRESETS = [
  { name: 'Water Bottle 500ml', stockUnit: 'pcs', currentStock: '24', lowStockThreshold: '10' },
  { name: 'Cold Drink — Medium (300ml)', stockUnit: 'pcs', currentStock: '12', lowStockThreshold: '6' },
  { name: 'Cold Drink — Large (600ml)', stockUnit: 'pcs', currentStock: '10', lowStockThreshold: '4' },
  { name: 'Mineral Water 1ltr', stockUnit: 'pcs', currentStock: '20', lowStockThreshold: '8' },
  { name: 'Milk', stockUnit: 'ltr', currentStock: '5', lowStockThreshold: '2' },
  { name: 'Sugar', stockUnit: 'kg', currentStock: '3', lowStockThreshold: '1' },
];

const InventoryDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [seeding, setSeeding] = useState(false);

  const [form, setForm] = useState({
    name: '',
    stockUnit: 'pcs',
    currentStock: '',
    lowStockThreshold: '5'
  });

  const stockStatus = (item) => {
    const cur = parseFloat(item.currentStock);
    const low = parseFloat(item.lowStockThreshold);
    if (!Number.isFinite(cur) || !Number.isFinite(low)) return 'unknown';
    return cur <= low ? 'low' : 'ok';
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [items]);
  const lowStockItems = useMemo(
    () => sortedItems.filter((item) => stockStatus(item) === 'low'),
    [sortedItems]
  );

  const fetchInventory = async () => {
    try {
      const res = await inventoryApi.getInventory();
      if (res.success) setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await inventoryApi.addOrUpdateInventory({
        ...form,
        currentStock: parseFloat(form.currentStock),
        lowStockThreshold: parseFloat(form.lowStockThreshold)
      });
      if (res.success) {
        setMessage('✅ Stock updated (audit log recorded).');
        fetchInventory();
        setForm({ name: '', stockUnit: form.stockUnit, currentStock: '', lowStockThreshold: form.lowStockThreshold });
        setTimeout(() => setMessage(''), 3500);
      }
    } catch (err) {
      setMessage('❌ Failed to update inventory');
    }
  };

  const handleSeedDemo = async (replace) => {
    setSeeding(true);
    setMessage('');
    try {
      const res = await inventoryApi.seedDemoInventory(replace);
      if (res.success) {
        setItems(res.data || []);
        setMessage('✅ ' + (res.message || 'Demo stock loaded.'));
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setMessage('❌ ' + (err.message || 'Seed failed'));
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="inventory-dashboard inventory-dashboard--loading">Loading inventory…</div>;

  return (
    <div className="inventory-dashboard">
      <h2>📦 Inventory / Stock</h2>
      <p className="inventory-lead">
        Track <strong>water bottles, cold drinks (S/M/L), milk</strong>, and kitchen supplies. Use <strong>quick-fill</strong> chips or <strong>Load demo stock</strong> to populate the table.
      </p>

      {message && (
        <div className={'inventory-alert ' + (message.includes('✅') ? 'success' : 'error')}>{message}</div>
      )}

      {lowStockItems.length > 0 && (
        <div className="inventory-alert error">
          ⚠ Low stock: {lowStockItems.map((x) => x.name).join(', ')}
        </div>
      )}

      <div className="inventory-seed-bar">
        <button
          type="button"
          className="btn-seed"
          disabled={seeding}
          onClick={() => handleSeedDemo(false)}
        >
          {seeding ? '…' : 'Load demo stock (bottles, cold drinks, milk…)'}
        </button>
        <button
          type="button"
          className="btn-seed btn-seed--secondary"
          disabled={seeding}
          onClick={() => handleSeedDemo(true)}
        >
          Reset demo quantities
        </button>
      </div>

      <div className="inventory-grid">
        <div className="stock-list-panel">
          <h3>Current stock levels</h3>
          {sortedItems.length === 0 ? (
            <p className="inventory-empty">No rows yet. Use &quot;Load demo stock&quot; or add items on the right.</p>
          ) : (
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>On hand</th>
                    <th>Unit</th>
                    <th>Low alert</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => {
                    const st = stockStatus(item);
                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td><strong>{fmtStock(item.currentStock)}</strong></td>
                        <td>{item.stockUnit}</td>
                        <td>{fmtStock(item.lowStockThreshold)}</td>
                        <td>
                          {st === 'low' ? (
                            <span className="badge warning">Low — reorder</span>
                          ) : (
                            <span className="badge safe">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="add-stock-panel">
          <h3>Add / update stock</h3>
          <p className="preset-hint">Quick fill (loads name, unit, and suggested quantities into the form):</p>
          <div className="preset-chips">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="preset-chip"
                onClick={() => setForm({
                  name: p.name,
                  stockUnit: p.stockUnit,
                  currentStock: p.currentStock,
                  lowStockThreshold: p.lowStockThreshold
                })}
              >
                {p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="inventory-form">
            <div className="form-group">
              <label>Item name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Quantity to add (+)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                value={form.stockUnit}
                onChange={(e) => setForm({ ...form, stockUnit: e.target.value })}
              >
                <option value="pcs">Pieces / bottles (pcs)</option>
                <option value="ltr">Litres (ltr)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="pkts">Packets</option>
              </select>
            </div>

            <div className="form-group">
              <label>Low stock alert below</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-save-stock">Save stock &amp; audit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

function fmtStock(v) {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return String(v ?? '—');
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default InventoryDashboard;
