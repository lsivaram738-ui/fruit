import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Fruit {
  id: number;
  name: string;
  unit: string;
  active: boolean;
}

export default function AdminFruits() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [newFruit, setNewFruit] = useState({ name: '', unit: 'kg' });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchFruits(); }, []);

  const fetchFruits = async () => {
    const res = await fetch('/api/admin/fruits');
    const data = await res.json();
    setFruits(data);
    setLoading(false);
  };

  const addFruit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (!newFruit.name.trim()) return setError('Fruit name is required.');
    setAdding(true);
    const res = await fetch('/api/admin/fruits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFruit),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setError(data.error || 'Failed to add fruit.'); }
    else { setMsg(`${data.name} added!`); setNewFruit({ name: '', unit: 'kg' }); fetchFruits(); }
  };

  const toggleFruit = async (id: number, active: boolean) => {
    await fetch('/api/admin/fruits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchFruits();
  };

  return (
    <>
      <Head><title>Manage Fruits – FreshMarket</title></Head>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="flex-between mb-24">
            <div>
              <h2 style={{ fontSize: 26 }}>Manage Fruits</h2>
              <p className="text-muted" style={{ fontSize: 14 }}>Add or toggle fruit availability</p>
            </div>
            <Link href="/admin" className="btn btn-secondary">← Back to Dashboard</Link>
          </div>

          <div className="grid-2">
            {/* Add fruit form */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 18 }}>➕ Add New Fruit</span>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-error">{error}</div>}
                {msg && <div className="alert alert-success">{msg}</div>}
                <form onSubmit={addFruit}>
                  <div className="form-group">
                    <label className="label">Fruit Name</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. Pomegranate"
                      value={newFruit.name}
                      onChange={e => setNewFruit({ ...newFruit, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Unit</label>
                    <select
                      className="input"
                      value={newFruit.unit}
                      onChange={e => setNewFruit({ ...newFruit, unit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="dozen">dozen</option>
                      <option value="piece">piece</option>
                      <option value="box">box</option>
                      <option value="litre">litre</option>
                    </select>
                  </div>
                  <button className="btn btn-primary btn-full" type="submit" disabled={adding}>
                    {adding ? 'Adding…' : 'Add Fruit'}
                  </button>
                </form>
              </div>
            </div>

            {/* Fruit list */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: 18 }}>🍎 All Fruits</span>
                <span className="badge badge-green">{fruits.filter(f => f.active).length} active</span>
              </div>
              {loading ? (
                <div className="card-body"><p className="text-muted">Loading…</p></div>
              ) : fruits.length === 0 ? (
                <div className="no-orders">
                  <p style={{ fontSize: 32 }}>🫙</p>
                  <p>No fruits added yet.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fruit</th>
                        <th>Unit</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fruits.map(fruit => (
                        <tr key={fruit.id}>
                          <td style={{ fontWeight: 600 }}>{fruit.name}</td>
                          <td className="text-muted">{fruit.unit}</td>
                          <td>
                            <span className={`badge ${fruit.active ? 'badge-green' : 'badge-amber'}`}>
                              {fruit.active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${fruit.active ? 'btn-danger' : 'btn-secondary'}`}
                              onClick={() => toggleFruit(fruit.id, fruit.active)}
                            >
                              {fruit.active ? 'Hide' : 'Show'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
