import React from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { getViewer } from '../lib/auth';

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  imagePath?: string | null;
  isPublic?: boolean;
  ownerId?: string | null;
  ownerName?: string | null;
};

type ApiList<T> = { total: number; items: T[] };

export default function Recipes() {
  const viewer = getViewer();
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [total, setTotal] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Filters
  const [q, setQ] = React.useState('');
  const [order, setOrder] = React.useState<'recent' | 'title'>('recent');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const pageSize = 50;

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      r.tags?.forEach((t) => set.add(t));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  async function load() {
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    if (order !== 'recent') params.set('order', order);
    params.set('limit', String(pageSize));
    params.set('offset', String(page * pageSize));

    try {
      const res = await apiFetch(`/api/recipes?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data: ApiList<Recipe> = await res.json();
      setRecipes(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [order, page]);
  React.useEffect(() => { setPage(0); load(); /* eslint-disable-next-line */ }, [selectedTags]);

  function submitSearch(e: React.FormEvent) { e.preventDefault(); setPage(0); load(); }
  function clearFilters() { setQ(''); setSelectedTags([]); setOrder('recent'); setPage(0); load(); }
  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this recipe?')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setRecipes((list) => list.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Recipes</h2>
        <Link to="/recipes/new" className="border rounded px-3 py-2">Create</Link>
      </div>

      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input className="border rounded px-3 py-2" placeholder="Search title/description…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded px-3 py-2" value={order} onChange={(e) => setOrder(e.target.value as any)}>
          <option value="recent">Most recent</option>
          <option value="title">Title (A–Z)</option>
        </select>
        <button className="border rounded px-3 py-2">Search</button>
        <button type="button" className="border rounded px-3 py-2" onClick={clearFilters}>Clear</button>
      </form>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button key={t} onClick={() => toggleTag(t)}
                className={`text-xs border rounded px-2 py-1 ${active ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>
                {t}
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {recipes.map((r) => {
          const isOwner = r.ownerId && r.ownerId === viewer.id;
          return (
            <li key={r.id} className="border rounded p-3 flex items-center gap-4">
              <div className="w-16 h-16 border rounded overflow-hidden bg-gray-50 flex-shrink-0">
                {r.imagePath ? (
                  <img src={r.imagePath} alt={r.title} className="w-full h-full object-cover"
                       onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link to={`/recipes/${r.id}`} className="font-medium hover:underline truncate block">{r.title}</Link>
                <div className="text-xs text-gray-600 flex gap-2 items-center">
                  <span className={`px-1.5 py-0.5 rounded border ${r.isPublic ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                    {r.isPublic ? 'Public' : 'Private'}
                  </span>
                  {r.ownerName && <span>by {isOwner ? 'you' : r.ownerName}</span>}
                </div>
                {r.description && <div className="text-sm text-gray-600 truncate">{r.description}</div>}
                {r.tags?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.tags.map((t) => <span key={t} className="text-xs bg-gray-100 border rounded px-2 py-0.5">{t}</span>)}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                {isOwner && <Link to={`/recipes/${r.id}/edit`} className="text-sm underline">Edit</Link>}
                {isOwner && (
                  <button className="text-sm text-red-600 underline disabled:opacity-50"
                          onClick={() => onDelete(r.id)} disabled={deletingId === r.id}>
                    {deletingId === r.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {recipes.length === 0 && <div className="text-gray-600">No recipes match your filters.</div>}

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button className="border rounded px-2 py-1" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
          <div className="text-sm">Page {page + 1} / {totalPages}</div>
          <button className="border rounded px-2 py-1" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
        </div>
      )}
    </div>
  );
}
