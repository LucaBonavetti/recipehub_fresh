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
  isFavorited?: boolean;
};

type ListResponse = {
  items: Recipe[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function Recipes() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [q, setQ] = React.useState('');
  const [visibility, setVisibility] = React.useState<'all' | 'public' | 'mine'>(user ? 'all' : 'public');
  const [sort, setSort] = React.useState<'new' | 'old' | 'title'>('new');
  const [page, setPage] = React.useState(1);
  const [resp, setResp] = React.useState<ListResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function load(goToPage?: number) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      params.set('visibility', user ? visibility : 'public');
      params.set('sort', sort);
      params.set('page', String(goToPage ?? page));
      params.set('pageSize', '12');

      const r = await apiFetch(`/api/recipes?${params.toString()}`);
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      const j: ListResponse = await r.json();
      setResp(j);
      setPage(j.page);
    } catch (e: any) {
      setError(e?.message || String(e));
      setResp({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(1); // load first page on mount or when auth changes (visibility default)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function applyFilters() {
    load(1);
  }

  async function remove(id: string) {
    if (!confirm('Delete this recipe?')) return;
    const r = await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      alert(`Failed to delete (${r.status})`);
      return;
    }
    // If we deleted the last item on the page, go back a page if possible
    const nextCount = (resp?.items.length ?? 1) - 1;
    const nextPage = nextCount <= 0 && page > 1 ? page - 1 : page;
    await load(nextPage);
  }

  async function toggleFav(rid: string, cur: boolean | undefined) {
    if (!user) { nav('/login'); return; }
    const res = await apiFetch(`/api/recipes/${rid}/favorite`, { method: cur ? 'DELETE' : 'POST' });
    if (!res.ok) {
      alert(`${cur ? 'Unfavorite' : 'Favorite'} failed (${res.status})`);
      return;
    }
    setResp((state) =>
      state
        ? { ...state, items: state.items.map((x) => (x.id === rid ? { ...x, isFavorited: !cur } : x)) }
        : state,
    );
  }

  const items = resp?.items ?? [];
  const totalPages = resp?.totalPages ?? 1;

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
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
          <select
            className="border rounded px-2 py-1"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
            <option value="title">Title A–Z</option>
          </select>
          {user && (
            <select
              className="border rounded px-2 py-1"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
            >
              <option value="all">All (public + mine)</option>
              <option value="public">Public only</option>
              <option value="mine">My recipes</option>
            </select>
          )}
          <button className="border rounded px-3 py-1" onClick={applyFilters}>Search</button>
          <button className="border rounded px-3 py-1" onClick={() => nav('/recipes/new')}>+ New</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No recipes yet.</p>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((r) => {
              const isOwner = user && r.ownerId === user.id;
              return (
                <li key={r.id} className="border rounded p-3 flex gap-3">
                  {r.imagePath ? (
                    <img src={r.imagePath} alt="" className="w-24 h-24 object-cover rounded" />
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
                    {r.description && <p className="text-sm text-gray-700 line-clamp-2 mt-1">{r.description}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button className="text-sm underline" onClick={() => toggleFav(r.id, r.isFavorited)}>
                      {r.isFavorited ? '★ Unfavorite' : '☆ Favorite'}
                    </button>
                    {isOwner && (
                      <>
                        <button className="text-sm underline" onClick={() => nav(`/recipes/${r.id}/edit`)}>Edit</button>
                        <button className="text-sm text-red-600 underline" onClick={() => remove(r.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {resp?.page ?? 1} of {totalPages} · {resp?.total ?? 0} total
            </div>
            <div className="flex gap-2">
              <button
                className="border rounded px-3 py-1"
                onClick={() => load(page - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <button
                className="border rounded px-3 py-1"
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
