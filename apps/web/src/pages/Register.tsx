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
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Register</h2>
        <Link to="/recipes" className="underline">← Back to list</Link>
      </div>
      {err && <p className="text-red-600">{err}</p>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Display name</label>
          <input className="border rounded px-2 py-1 w-full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input className="border rounded px-2 py-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="border rounded px-2 py-1 w-full" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="border rounded px-4 py-1" type="submit" disabled={loading}>
          {loading ? 'Registering…' : 'Register'}
        </button>
      </form>
      <div className="text-sm">
        Already have an account?{' '}
        <Link className="underline" to="/login">
          Login
        </Link>
      </div>
    </div>
  );
}
