import React from 'react';
import { Link } from 'react-router-dom';

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  createdAt?: string;
};

export default function Recipes() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/recipes');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setRecipes(await res.json());
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  React.useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recipes</h2>
        <Link to="/recipes/new" className="border rounded px-3 py-2">Create</Link>
      </div>

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
        <div className="text-gray-600">No recipes yet. Click <span className="font-medium">Create</span> to add one.</div>
      )}
    </div>
  );
}
