import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthProvider';

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  imagePath?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  isPublic?: boolean;
};

export default function Recipes() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Recipe[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const r = await apiFetch(`/api/recipes${qs}`);
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      const j = await r.json();
      setItems(j.items || []);
    } catch (e: any) {
      setError(e?.message || String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id: string) {
    if (!confirm('Delete this recipe?')) return;
    const r = await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      alert(`Failed to delete (${r.status})`);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Recipes</h2>
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
          />
          <button className="border rounded px-3 py-1" onClick={load}>
            Search
          </button>
          <button className="border rounded px-3 py-1" onClick={() => nav('/recipes/new')}>
            + New
          </button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No recipes yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((r) => {
            const isOwner = user && r.ownerId === user.id;
            return (
              <li key={r.id} className="border rounded p-3 flex gap-3">
                {r.imagePath ? (
                  <img
                    src={r.imagePath}
                    alt=""
                    className="w-24 h-24 object-cover rounded"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                <div className="flex-1">
                  <Link to={`/recipes/${r.id}`} className="font-semibold hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {r.isPublic ? 'Public' : 'Private'}
                    {r.ownerName ? ` · by ${r.ownerName}` : ''}
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-1">{r.description}</p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex flex-col gap-2">
                    <button
                      className="text-sm underline"
                      onClick={() => nav(`/recipes/${r.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button className="text-sm text-red-600 underline" onClick={() => remove(r.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
