import React from 'react';
import { Link } from 'react-router-dom';

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  createdAt?: string;
};

type ApiList<T> = { total: number; items: T[] };

export default function Recipes() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [total, setTotal] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [q, setQ] = React.useState('');
  const [order, setOrder] = React.useState<'recent' | 'title'>('recent');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const pageSize = 50;

  // Tags available (derived from current items)
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes) {
      if (Array.isArray(r.tags)) {
        r.tags.forEach((t) => set.add(t));
      }
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
      const res = await fetch(`/api/recipes?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data: ApiList<Recipe> = await res.json();
      setRecipes(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [order, page]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Reload when tags change (reset to page 0)
  React.useEffect(() => { setPage(0); load(); /* eslint-disable-next-line */ }, [selectedTags]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    load();
  }

  function clearFilters() {
    setQ('');
    setSelectedTags([]);
    setOrder('recent');
    setPage(0);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Recipes</h2>
        <Link to="/recipes/new" className="border rounded px-3 py-2">Create</Link>
      </div>

      {/* Filters */}
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-3 py-2"
          placeholder="Search title/description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={order}
          onChange={(e) => setOrder(e.target.value as 'recent' | 'title')}
          title="Sort by"
        >
          <option value="recent">Most recent</option>
          <option value="title">Title (A–Z)</option>
        </select>
        <button className="border rounded px-3 py-2">Search</button>
        <button type="button" className="border rounded px-3 py-2" onClick={clearFilters}>
          Clear
        </button>
      </form>

      {/* Tag cloud (from current result set) */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`text-xs border rounded px-2 py-1 ${active ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}
                title={active ? 'Click to remove filter' : 'Click to filter by tag'}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-2">
        {recipes.map((r) => (
          <li key={r.id} className="border rounded p-3 flex items-center justify-between">
            <div className="min-w-0">
              <Link to={`/recipes/${r.id}`} className="font-medium hover:underline truncate block">
                {r.title}
              </Link>
              {r.description && (
                <div className="text-sm text-gray-600 truncate">{r.description}</div>
              )}
              {Array.isArray(r.tags) && r.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <span key={t} className="text-xs bg-gray-100 border rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <Link to={`/recipes/${r.id}/edit`} className="text-sm underline">Edit</Link>
          </li>
        ))}
      </ul>

      {recipes.length === 0 && (
        <div className="text-gray-600">No recipes match your filters.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            className="border rounded px-2 py-1"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Prev
          </button>
          <div className="text-sm">
            Page {page + 1} / {totalPages}
          </div>
          <button
            className="border rounded px-2 py-1"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
