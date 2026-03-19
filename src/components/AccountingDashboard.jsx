import React, { useState, useEffect } from 'react';
import { accountingApi } from '../api/config';
import './AccountingDashboard.css';

const AccountingDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: 'salary',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [expenseMessage, setExpenseMessage] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await accountingApi.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await accountingApi.addExpense(expenseForm);
      if (res.success) {
        setExpenseMessage('✅ Expense Added Successfully!');
        setExpenseForm({ ...expenseForm, amount: '', description: '' });
        fetchMetrics(); // Refresh dashboard
        setTimeout(() => setExpenseMessage(''), 3000);
      }
    } catch (err) {
      setExpenseMessage('❌ Failed to add expense');
    }
  };

  if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Accounting...</div>;
  if (!metrics) return <div style={{color:'#f44336', padding:'20px', textAlign:'center'}}>You must be logged in as an Admin to view Accounting Metrics, or no data is available.</div>;

  return (
    <div className="accounting-dashboard">
      <h2>📊 Profit & Loss Dashboard</h2>
      
      <div className="dashboard-grid">
        {/* Metric Cards */}
        <div className="metrics-panel">
          <div className="metric-card gross">
            <h4>Total Revenue (Gross)</h4>
            <h2>₹{parseFloat(metrics.revenue.total).toFixed(2)}</h2>
            <small>Rooms: ₹{metrics.revenue.breakdown.room.toFixed(2)} | Food: ₹{metrics.revenue.breakdown.food.toFixed(2)}</small>
          </div>

          <div className="metric-card expense">
            <h4>Total Expenses</h4>
            <h2>₹{parseFloat(metrics.expenses.total).toFixed(2)}</h2>
            <div className="breakdown">
              {Object.keys(metrics.expenses.breakdown).map(cat => (
                <small key={cat}>{cat.toUpperCase()}: ₹{metrics.expenses.breakdown[cat].toFixed(2)}</small>
              ))}
            </div>
          </div>

          <div className="metric-card tax">
            <h4>GST / Tax Collected</h4>
            <h2>₹{parseFloat(metrics.revenue.taxCollected).toFixed(2)}</h2>
            <small>To be paid to Govt</small>
          </div>

          <div className={`metric-card profit ${metrics.profit >= 0 ? 'positive' : 'negative'}`}>
            <h4>Net Profit (Revenue - Expenses)</h4>
            <h2>₹{parseFloat(metrics.profit).toFixed(2)}</h2>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="expense-form-panel">
          <h3>💸 Add Daily Expense</h3>
          {expenseMessage && <div className={`expense-alert ${expenseMessage.includes('✅') ? 'success' : 'error'}`}>{expenseMessage}</div>}
          
          <form onSubmit={handleExpenseSubmit} className="expense-form">
            <div className="form-group">
              <label>Category</label>
              <select 
                value={expenseForm.category}
                onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
              >
                <option value="salary">Staff Salary</option>
                <option value="food_cost">Raw Material / Food Cost</option>
                <option value="electricity">Electricity</option>
                <option value="maintenance">Maintenance & Repairs</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                required 
                min="0" 
                value={expenseForm.amount}
                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                required 
                value={expenseForm.date}
                onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea 
                rows="2" 
                value={expenseForm.description}
                onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
              />
            </div>

            <button type="submit" className="btn-add-expense">Add Expense</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountingDashboard;
