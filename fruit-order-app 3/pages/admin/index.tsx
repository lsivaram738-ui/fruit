import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface FruitRate {
  id: number;
  name: string;
  unit: string;
  price: number | null;
}
interface Order {
  user_id: number;
  user_name: string;
  phone: string;
  fruit_id: number;
  fruit_name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export default function AdminDashboard() {
  const [rates, setRates] = useState<FruitRate[]>([]);
  const [rateInputs, setRateInputs] = useState<Record<number, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rateMsg, setRateMsg] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [rRes, oRes] = await Promise.all([
      fetch('/api/admin/rates'),
      fetch('/api/admin/orders'),
    ]);
    const rData = await rRes.json();
    const oData = await oRes.json();
    setRates(rData);
    const inputs: Record<number, string> = {};
    rData.forEach((r: FruitRate) => { inputs[r.id] = r.price ? String(r.price) : ''; });
    setRateInputs(inputs);
    setOrders(oData);
    setLoading(false);
  };

  const saveRates = async () => {
    setSaving(true);
    setRateMsg('');
    const rateArr = rates.map(r => ({ fruit_id: r.id, price: rateInputs[r.id] || 0 }));
    const res = await fetch('/api/admin/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates: rateArr }),
    });
    setSaving(false);
    if (res.ok) { setRateMsg('Rates saved!'); fetchAll(); }
  };

  // Consolidated totals per fruit
  const consolidated: Record<string, { unit: string; qty: number; amount: number }> = {};
  orders.forEach(o => {
    if (!consolidated[o.fruit_name]) consolidated[o.fruit_name] = { unit: o.unit, qty: 0, amount: 0 };
    consolidated[o.fruit_name].qty += Number(o.quantity);
    consolidated[o.fruit_name].amount += Number(o.total);
  });

  // Per-user totals
  const userTotals: Record<number, { name: string; phone: string; total: number; items: Order[] }> = {};
  orders.forEach(o => {
    if (!userTotals[o.user_id]) userTotals[o.user_id] = { name: o.user_name, phone: o.phone, total: 0, items: [] };
    userTotals[o.user_id].total += Number(o.total);
    userTotals[o.user_id].items.push(o);
  });

  const downloadCSV = () => {
    const lines = ['User,Phone,Fruit,Qty,Unit,Rate,Amount'];
    orders.forEach(o => {
      lines.push(`"${o.user_name}","${o.phone}","${o.fruit_name}",${o.quantity},${o.unit},${Number(o.price).toFixed(2)},${Number(o.total).toFixed(2)}`);
    });
    lines.push('');
    lines.push('CONSOLIDATED TOTALS');
    lines.push('Fruit,Total Qty,Unit,Total Amount');
    Object.entries(consolidated).forEach(([name, v]) => {
      lines.push(`"${name}",${v.qty.toFixed(2)},${v.unit},${v.amount.toFixed(2)}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const downloadAndReset = async () => {
    if (!confirm('Download orders and clear all of today\'s orders? This cannot be undone.')) return;
    downloadCSV();
    setResetting(true);
    await fetch('/api/admin/orders', { method: 'DELETE' });
    setResetting(false);
    fetchAll();
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const grandTotal = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <Head><title>Admin – FreshMarket</title></Head>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="flex-between mb-24">
            <div>
              <h2 style={{ fontSize: 26 }}>Admin Dashboard</h2>
              <p className="text-muted" style={{ fontSize: 14 }}>{today}</p>
            </div>
            <Link href="/admin/fruits" className="btn btn-secondary">
              ⚙️ Manage Fruits
            </Link>
          </div>

          {/* Stats */}
          <div className="grid-3 mb-24">
            <div className="stat-card">
              <div className="stat-label">Orders Today</div>
              <div className="stat-value">{Object.keys(userTotals).length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Items Ordered</div>
              <div className="stat-value">{orders.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Grand Total</div>
              <div className="stat-value">₹{grandTotal.toFixed(0)}</div>
            </div>
          </div>

          <div className="grid-2 mb-24">
            {/* Set Rates */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 18 }}>📋 Today's Rates</span>
                {rateMsg && <span className="badge badge-green">{rateMsg}</span>}
              </div>
              <div className="card-body">
                {loading ? <p className="text-muted">Loading…</p> : (
                  <>
                    {rates.length === 0 ? (
                      <p className="text-muted">No fruits added yet. <Link href="/admin/fruits">Add fruits →</Link></p>
                    ) : rates.map(fruit => (
                      <div className="fruit-row" key={fruit.id}>
                        <div>
                          <div className="fruit-name">{fruit.name}</div>
                          <div className="fruit-unit">per {fruit.unit}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 14 }}>₹</span>
                          <input
                            type="number"
                            className="qty-input"
                            placeholder="0.00"
                            min="0"
                            step="0.5"
                            value={rateInputs[fruit.id] || ''}
                            onChange={e => setRateInputs({ ...rateInputs, [fruit.id]: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 20 }}>
                      <button className="btn btn-primary btn-full" onClick={saveRates} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Rates'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Consolidated */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 18 }}>📦 Consolidated Totals</span>
              </div>
              {Object.keys(consolidated).length === 0 ? (
                <div className="no-orders">
                  <p style={{ fontSize: 32 }}>📭</p>
                  <p>No orders placed yet today.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Fruit</th><th>Total Qty</th><th>Amount</th></tr></thead>
                    <tbody>
                      {Object.entries(consolidated).map(([name, v]) => (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{v.qty.toFixed(2)} {v.unit}</td>
                          <td style={{ fontWeight: 600 }}>₹{v.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Per-user orders */}
          <div className="card mb-24">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: 18 }}>👥 Orders by User</span>
              {orders.length > 0 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>⬇ Download CSV</button>
                  <button className="btn btn-danger btn-sm" onClick={downloadAndReset} disabled={resetting}>
                    {resetting ? 'Clearing…' : '⬇ Download & Reset'}
                  </button>
                </div>
              )}
            </div>
            {Object.keys(userTotals).length === 0 ? (
              <div className="no-orders">
                <p style={{ fontSize: 32 }}>📭</p>
                <p>No orders yet. Users will place orders after you set today's rates.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Phone</th>
                      <th>Fruit</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(userTotals).map(u =>
                      u.items.map((o, i) => (
                        <tr key={`${u.name}-${o.fruit_id}`}>
                          {i === 0 && (
                            <>
                              <td rowSpan={u.items.length} style={{ fontWeight: 600, verticalAlign: 'top', paddingTop: 16 }}>{u.name}</td>
                              <td rowSpan={u.items.length} style={{ color: 'var(--muted)', fontSize: 13, verticalAlign: 'top', paddingTop: 16 }}>{u.phone}</td>
                            </>
                          )}
                          <td>{o.fruit_name}</td>
                          <td>{o.quantity} {o.unit}</td>
                          <td>₹{Number(o.price).toFixed(2)}</td>
                          <td>₹{Number(o.total).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                    <tr>
                      <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right' }}>Grand Total</td>
                      <td style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>₹{grandTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  if ((session.user as any).role !== 'admin') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  return { props: {} };
};
