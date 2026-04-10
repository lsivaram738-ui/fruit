import { useEffect, useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import { GetServerSideProps } from 'next';

interface FruitRate {
  id: number;
  name: string;
  unit: string;
  price: number | null;
}
interface OrderItem {
  fruit_id: number;
  fruit_name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rates, setRates] = useState<FruitRate[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [existingOrders, setExistingOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch('/api/user/orders');
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    setRates(data.rates || []);
    // Pre-fill existing quantities
    const qmap: Record<number, string> = {};
    (data.orders || []).forEach((o: OrderItem) => {
      qmap[o.fruit_id] = String(o.quantity);
    });
    setQuantities(qmap);
    setExistingOrders(data.orders || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    const items = rates
      .filter(r => r.price && quantities[r.id] && parseFloat(quantities[r.id]) > 0)
      .map(r => ({ fruit_id: r.id, quantity: parseFloat(quantities[r.id]) }));

    if (!items.length) {
      return setError('Please enter at least one quantity.');
    }
    setSaving(true);
    const res = await fetch('/api/user/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Order placed successfully!');
      fetchData();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to save order.');
    }
  };

  const orderTotal = rates.reduce((sum, r) => {
    const qty = parseFloat(quantities[r.id] || '0');
    const price = r.price || 0;
    return sum + qty * price;
  }, 0);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <Head><title>Order Fruits – FreshMarket</title></Head>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="flex-between mb-24">
            <div>
              <h2 style={{ fontSize: 26 }}>Today's Order</h2>
              <p className="text-muted" style={{ fontSize: 14 }}>{today}</p>
            </div>
            {existingOrders.length > 0 && (
              <span className="badge badge-green">✓ Order saved</span>
            )}
          </div>

          {loading ? (
            <p className="text-muted text-center" style={{ padding: '40px 0' }}>Loading today's rates…</p>
          ) : rates.length === 0 ? (
            <div className="card">
              <div className="no-orders">
                <p style={{ fontSize: 40 }}>⏳</p>
                <p>Admin hasn't set today's rates yet. Check back soon!</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="card mb-24">
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: 18 }}>🛒 Select your quantities</span>
                  {orderTotal > 0 && (
                    <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 18 }}>
                      ₹{orderTotal.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="card-body">
                  {msg && <div className="alert alert-success">{msg}</div>}
                  {error && <div className="alert alert-error">{error}</div>}

                  {rates.map(fruit => (
                    <div className="fruit-row" key={fruit.id}>
                      <div>
                        <div className="fruit-name">{fruit.name}</div>
                        <div className="fruit-unit" style={{ fontSize: 12 }}>
                          {fruit.price
                            ? <><span className="fruit-price">₹{Number(fruit.price).toFixed(2)}</span> / {fruit.unit}</>
                            : <span style={{ color: 'var(--amber)' }}>Rate not set today</span>
                          }
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {quantities[fruit.id] && parseFloat(quantities[fruit.id]) > 0 && fruit.price && (
                          <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 70, textAlign: 'right' }}>
                            ₹{(parseFloat(quantities[fruit.id]) * Number(fruit.price)).toFixed(2)}
                          </span>
                        )}
                        <input
                          type="number"
                          className="qty-input"
                          placeholder="0"
                          min="0"
                          step="0.5"
                          disabled={!fruit.price}
                          value={quantities[fruit.id] || ''}
                          onChange={e => setQuantities({ ...quantities, [fruit.id]: e.target.value })}
                        />
                        <span style={{ fontSize: 12, color: 'var(--muted)', width: 20 }}>{fruit.unit}</span>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : existingOrders.length > 0 ? '✓ Update Order' : 'Place Order'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {existingOrders.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 18 }}>Your current order</span>
                <span className="badge badge-green">Saved</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fruit</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingOrders.map(o => (
                      <tr key={o.fruit_id}>
                        <td>{o.fruit_name}</td>
                        <td>{o.quantity} {o.unit}</td>
                        <td>₹{Number(o.price).toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>₹{Number(o.total).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right' }}>Total</td>
                      <td style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>
                        ₹{existingOrders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  if ((session.user as any).role === 'admin') {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
};
