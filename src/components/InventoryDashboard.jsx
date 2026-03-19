import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/config';
import './InventoryDashboard.css';

const InventoryDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    stockUnit: 'kg',
    currentStock: '',
    lowStockThreshold: '5'
  });

  const fetchInventory = async () => {
    try {
      const res = await inventoryApi.getInventory();
      if (res.success) {
        setItems(res.data);
      }
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
      const res = await inventoryApi.addOrUpdateInventory(form);
      if (res.success) {
        setMessage('✅ Inventory Updated! (Audit Log Recorded)');
        fetchInventory();
        setForm({ name: '', stockUnit: 'kg', currentStock: '', lowStockThreshold: '5' });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('❌ Failed to update inventory');
    }
  };

  if (loading) return <div style={{padding:'20px', color:'white'}}>Loading Inventory...</div>;

  return (
    <div className="inventory-dashboard">
      <h2>📦 Inventory & Stock Management</h2>
      
      {message && <div className="inventory-alert success">{message}</div>}

      <div className="inventory-grid">
        <div className="stock-list-panel">
          <h3>Current Stock Levels</h3>
          {items.length === 0 ? (
             <p>No inventory items found. Add some raw materials!</p>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Current Stock</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><strong>{item.currentStock}</strong></td>
                    <td>{item.stockUnit}</td>
                    <td>
                      {item.currentStock <= item.lowStockThreshold ? (
                        <span className="badge warning">Low Stock</span>
                      ) : (
                        <span className="badge safe">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="add-stock-panel">
          <h3>Add / Update Raw Material</h3>
          <form onSubmit={handleSubmit} className="inventory-form">
            <div className="form-group">
              <label>Item Name (e.g., Rice, Chicken)</label>
              <input 
                type="text" 
                required 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Stock to Add (Quantity)</label>
              <input 
                type="number" 
                required 
                step="0.01"
                min="0"
                value={form.currentStock}
                onChange={e => setForm({...form, currentStock: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Unit (kg, ltr, pkts, pcs)</label>
              <select 
                value={form.stockUnit}
                onChange={e => setForm({...form, stockUnit: e.target.value})}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="ltr">Litres (ltr)</option>
                <option value="pkts">Packets</option>
                <option value="pcs">Pieces</option>
              </select>
            </div>

            <div className="form-group">
              <label>Low Stock Alert Threshold</label>
              <input 
                type="number" 
                required 
                min="0"
                value={form.lowStockThreshold}
                onChange={e => setForm({...form, lowStockThreshold: e.target.value})}
              />
            </div>

            <button type="submit" className="btn-save-stock">Save Stock & Audit</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InventoryDashboard;
