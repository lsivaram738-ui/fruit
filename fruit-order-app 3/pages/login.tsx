import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', {
      phone: form.phone,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Invalid phone number or password.');
    } else {
      // Redirect based on role — fetch session
      const res = await fetch('/api/auth/session');
      const sess = await res.json();
      if (sess?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <>
      <Head><title>Sign In – FreshMarket</title></Head>
      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-logo">
            <h1>🍋 FreshMarket</h1>
            <p>Daily fruit ordering platform</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input
                className="input"
                type="tel"
                placeholder="Your registered phone number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary btn-full mt-8" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-24 text-muted" style={{ fontSize: 14 }}>
            New here?{' '}
            <Link href="/register" style={{ color: 'var(--green)', fontWeight: 600 }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
