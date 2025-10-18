import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await register(email, password, displayName);
      nav('/recipes');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-sm">
      <h2 className="text-xl font-semibold">Register</h2>
      {err && <div className="text-red-600">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Display name</label>
          <input className="border rounded px-3 py-2 w-full" required value={displayName} onChange={e=>setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="border rounded px-3 py-2 w-full" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="border rounded px-3 py-2 w-full" type="password" required value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="border rounded px-4 py-2" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
      </form>
      <div className="text-sm">Already have an account? <Link to="/login" className="underline">Login</Link></div>
    </div>
  );
}
