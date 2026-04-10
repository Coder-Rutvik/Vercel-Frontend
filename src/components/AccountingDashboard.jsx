import React, { useState, useEffect } from 'react';
import { accountingApi } from '../api/config';
import './AccountingDashboard.css';

const fmt = (n) => {
  const x = parseFloat(n);
  return Number.isFinite(x) ? x.toFixed(2) : '0.00';
};

const AccountingDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const [expenseForm, setExpenseForm] = useState({
    category: 'salary',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [expenseMessage, setExpenseMessage] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setReportsLoading(true);
    setTrendsLoading(true);
    try {
      const [mRes, rRes, tRes] = await Promise.all([
        accountingApi.getDashboardMetrics(),
        accountingApi.getReports().catch(() => null),
        accountingApi.getTrends(14).catch(() => null)
      ]);
      if (mRes.success) setMetrics(mRes.data);
      if (rRes && rRes.success) setReports(rRes.data);
      if (tRes && tRes.success) setTrends(tRes.data);
      else setTrends(null);
    } catch (err) {
      console.error(err);
      setMetrics(null);
      setTrends(null);
    } finally {
      setLoading(false);
      setReportsLoading(false);
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await accountingApi.addExpense(expenseForm);
      if (res.success) {
        setExpenseMessage('✅ Expense Added Successfully!');
        setExpenseForm({ ...expenseForm, amount: '', description: '' });
        fetchAll();
        setTimeout(() => setExpenseMessage(''), 3000);
      }
    } catch (err) {
      setExpenseMessage('❌ Failed to add expense');
    }
  };

  if (loading) return <div className="accounting-dashboard accounting-dashboard--loading">Loading accounting…</div>;
  if (!metrics) {
    return (
      <div className="accounting-dashboard accounting-dashboard--error">
        <p>Could not load P&amp;L. Log in and ensure the backend is running (including /api/accounting routes).</p>
        <button type="button" className="accounting-retry" onClick={fetchAll}>Retry</button>
      </div>
    );
  }

  const revenueTotal = parseFloat(metrics.revenue?.total ?? 0);
  const expenseTotal = parseFloat(metrics.expenses?.total ?? 0);
  const net = parseFloat(metrics.profit ?? revenueTotal - expenseTotal);
  const isProfit = net >= 0;
  const breakdown = metrics.expenses?.breakdown || {};
  const trendLabels = trends?.labels || [];
  const revenueSeries = trends?.revenueSeries || [];
  const bookingSeries = trends?.bookingSeries || [];
  const revenueMax = Math.max(1, ...revenueSeries);
  const bookingMax = Math.max(1, ...bookingSeries);

  const shortDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="accounting-dashboard">
      <div className="accounting-hero">
        <h2>📊 Accounting — Profit &amp; Loss (P&amp;L)</h2>
        <p className="accounting-sub">
          Total revenue, expenses, and <strong>net profit or loss</strong> in one place (from paid bills and logged expenses).
        </p>
      </div>

      <div className={`pl-summary ${isProfit ? 'pl-summary--profit' : 'pl-summary--loss'}`}>
        <div className="pl-summary__main">
          <span className="pl-summary__label">{isProfit ? '✅ Net profit' : '⚠️ Net loss'}</span>
          <span className="pl-summary__value">₹{fmt(Math.abs(net))}</span>
        </div>
        <p className="pl-summary__hint">
          Gross room + food sales (per dashboard) minus all expenses = <strong>₹{fmt(net)}</strong> (GST collected is shown separately).
        </p>
      </div>

      <div className="pl-statement">
        <h3 className="pl-statement__title">P&amp;L summary</h3>
        <table className="pl-table">
          <tbody>
            <tr>
              <td>Room rent (paid bills)</td>
              <td className="pl-table__num">+ ₹{fmt(metrics.revenue?.breakdown?.room)}</td>
            </tr>
            <tr>
              <td>Food (paid bills)</td>
              <td className="pl-table__num">+ ₹{fmt(metrics.revenue?.breakdown?.food)}</td>
            </tr>
            <tr className="pl-table__strong">
              <td>Gross revenue</td>
              <td className="pl-table__num">₹{fmt(revenueTotal)}</td>
            </tr>
            <tr className="pl-table__spacer"><td colSpan={2} /></tr>
            <tr>
              <td>All expenses</td>
              <td className="pl-table__num pl-table__neg">− ₹{fmt(expenseTotal)}</td>
            </tr>
            <tr className="pl-table__strong pl-table__total">
              <td>{isProfit ? 'Profit' : 'Loss'} (revenue − expenses)</td>
              <td className="pl-table__num">{isProfit ? '' : '− '}₹{fmt(Math.abs(net))}</td>
            </tr>
          </tbody>
        </table>
        <p className="pl-tax-note">
          <strong>GST collected:</strong> ₹{fmt(metrics.revenue?.taxCollected)} — liability to remit (demo accounting).
        </p>
      </div>

      <div className="analytics-panel">
        <h3>📈 Basic analytics charts</h3>
        {trendsLoading ? (
          <p className="reports-panel__muted">Loading chart data…</p>
        ) : trends ? (
          <div className="analytics-grid">
            <div className="chart-card">
              <h4>Revenue trend (last {trends.days} days)</h4>
              <div className="mini-chart">
                {trendLabels.map((label, idx) => {
                  const value = revenueSeries[idx] || 0;
                  const height = Math.max(6, Math.round((value / revenueMax) * 100));
                  return (
                    <div className="mini-chart__col" key={`rev-${label}`}>
                      <div className="mini-chart__bar mini-chart__bar--revenue" style={{ height: `${height}%` }} title={`₹${fmt(value)}`} />
                      <span className="mini-chart__label">{shortDate(label)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="chart-card">
              <h4>Booking trend (last {trends.days} days)</h4>
              <div className="mini-chart">
                {trendLabels.map((label, idx) => {
                  const value = bookingSeries[idx] || 0;
                  const height = Math.max(6, Math.round((value / bookingMax) * 100));
                  return (
                    <div className="mini-chart__col" key={`book-${label}`}>
                      <div className="mini-chart__bar mini-chart__bar--booking" style={{ height: `${height}%` }} title={`${value} bookings`} />
                      <span className="mini-chart__label">{shortDate(label)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="reports-panel__muted">Trend chart data unavailable.</p>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="metrics-panel">
          <div className="metric-card gross">
            <h4>Total Revenue (Gross)</h4>
            <h2>₹{fmt(metrics.revenue.total)}</h2>
            <small>Rooms: ₹{fmt(metrics.revenue.breakdown.room)} | Food: ₹{fmt(metrics.revenue.breakdown.food)}</small>
          </div>

          <div className="metric-card expense">
            <h4>Total Expenses</h4>
            <h2>₹{fmt(metrics.expenses.total)}</h2>
            <div className="breakdown">
              {Object.keys(breakdown).length === 0 ? (
                <small>No expenses recorded yet.</small>
              ) : (
                Object.keys(breakdown).map((cat) => (
                  <small key={cat}>{cat.toUpperCase()}: ₹{fmt(breakdown[cat])}</small>
                ))
              )}
            </div>
          </div>

          <div className="metric-card tax">
            <h4>GST / Tax Collected</h4>
            <h2>₹{fmt(metrics.revenue.taxCollected)}</h2>
            <small>To be paid to Govt</small>
          </div>

          <div className={`metric-card profit ${isProfit ? 'positive' : 'negative'}`}>
            <h4>Net result</h4>
            <h2>₹{fmt(net)}</h2>
          </div>
        </div>

        <div className="expense-form-panel">
          <h3>💸 Add Daily Expense</h3>
          <p className="expense-form-panel__hint">Saving an expense refreshes the figures above.</p>
          {expenseMessage && <div className={`expense-alert ${expenseMessage.includes('✅') ? 'success' : 'error'}`}>{expenseMessage}</div>}

          <form onSubmit={handleExpenseSubmit} className="expense-form">
            <div className="form-group">
              <label>Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              >
                <option value="salary">Staff Salary</option>
                <option value="food_cost">Raw Material / Food Cost</option>
                <option value="electricity">Electricity</option>
                <option value="maintenance">Maintenance &amp; Repairs</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                rows="2"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-add-expense">Add Expense</button>
          </form>
        </div>
      </div>

      <div className="reports-panel">
        <h3>📈 Extra reports</h3>
        {reportsLoading ? (
          <p className="reports-panel__muted">Loading reports…</p>
        ) : reports ? (
          <div className="reports-grid">
            <div className="reports-card">
              <h4>Top dishes (qty sold)</h4>
              {reports.topDishes && reports.topDishes.length > 0 ? (
                <ol className="reports-list">
                  {reports.topDishes.map((d) => (
                    <li key={d.name}>{d.name} — <strong>{d.sold}</strong></li>
                  ))}
                </ol>
              ) : (
                <p className="reports-panel__muted">No orders yet.</p>
              )}
            </div>
            <div className="reports-card">
              <h4>Occupancy &amp; RevPAR</h4>
              <p><strong>Occupancy:</strong> {reports.occupancyRate}</p>
              <p><strong>RevPAR:</strong> {reports.revPAR}</p>
              <p className="reports-panel__muted">Room revenue ÷ total rooms (demo formula).</p>
            </div>
          </div>
        ) : (
          <p className="reports-panel__muted">Reports unavailable.</p>
        )}
      </div>
    </div>
  );
};

export default AccountingDashboard;
