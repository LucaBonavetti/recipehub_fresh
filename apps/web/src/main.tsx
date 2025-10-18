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

type Recipe = { id: string; title: string; createdAt?: string; updatedAt?: string };

function Recipes() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [title, setTitle] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Inline edit state (per item)
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState<string>('');
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/recipes');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
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
    setCreating(true);
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
      setCreating(false);
    }
  }

  function startEdit(r: Recipe) {
    setEditingId(r.id);
    setEditTitle(r.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (!res.ok) throw new Error(`Failed to save (${res.status})`);
      setEditingId(null);
      setEditTitle('');
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSavingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this recipe?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDeletingId(null);
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
          disabled={creating || !title.trim()}
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {recipes.map((r) => {
          const isEditing = editingId === r.id;
          const isSaving = savingId === r.id;
          const isDeleting = deletingId === r.id;

          return (
            <li key={r.id} className="border rounded px-3 py-2">
              {!isEditing ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-gray-500">id: {r.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="border rounded px-3 py-1"
                      onClick={() => startEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="border rounded px-3 py-1 text-red-600"
                      onClick={() => remove(r.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    className="border rounded px-3 py-2 flex-1"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="border rounded px-3 py-2"
                    onClick={() => saveEdit(r.id)}
                    disabled={isSaving || !editTitle.trim()}
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    className="border rounded px-3 py-2"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {recipes.length === 0 && (
        <div className="text-gray-600">No recipes yet. Create your first one above.</div>
      )}
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
