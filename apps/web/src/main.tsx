import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import App from './App';
import './index.css';

function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Welcome to RecipeHub</h2>
      <p className="text-gray-600">Fresh start baseline is running.</p>
      <p><Link to="/recipes" className="text-blue-600 underline">Go to Recipes</Link></p>
    </div>
  );
}

function Health() {
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState<any>(null);
  React.useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setData).catch(setErr);
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">API Health</h2>
      {err && <pre className="text-red-600">{String(err)}</pre>}
      {data ? <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(data, null, 2)}</pre> : <p>Loading…</p>}
    </div>
  );
}

function Recipes() {
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      setRecipes(data);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  React.useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error(`Failed to create (${res.status})`);
      setTitle('');
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Recipes</h2>

      <form onSubmit={create} className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Recipe title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="border rounded px-4 py-2"
          disabled={loading || !title.trim()}
        >
          {loading ? 'Creating…' : 'Create'}
        </button>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {recipes.map((r) => (
          <li key={r.id} className="border rounded px-3 py-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-gray-500">id: {r.id}</div>
            </div>
            {/* We’ll add edit/delete next step */}
          </li>
        ))}
      </ul>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
      { index: true, element: <Home /> },
      { path: 'recipes', element: <Recipes /> },
      { path: 'health', element: <Health /> },
    ]},
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
