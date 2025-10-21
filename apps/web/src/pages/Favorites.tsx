import React from 'react';
import { apiFetch } from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  imagePath?: string | null;
  isPublic?: boolean;
  ownerId?: string | null;
  ownerName?: string | null;
};

export default function Favorites() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<Recipe[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch('/api/favorites');
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      const j = await r.json();
      setItems(j.items || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  if (!user) return <p>Please login to see your favorites.</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Favorites</h2>
        <Link to="/recipes" className="underline">← Back to list</Link>
      </div>

      {items.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((r) => (
            <li key={r.id} className="border rounded p-3 flex gap-3">
              {r.imagePath ? (
                <img src={r.imagePath} alt="" className="w-24 h-24 object-cover rounded" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <div className="flex-1">
                <Link to={`/recipes/${r.id}`} className="font-semibold hover:underline">{r.title}</Link>
                <div className="text-sm text-gray-500">
                  {r.isPublic ? 'Public' : 'Private'}
                  {r.ownerName ? ` · by ${r.ownerName}` : ''}
                </div>
                {r.description && <p className="text-sm text-gray-700 line-clamp-2 mt-1">{r.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
