import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthProvider';

type ProfileData = {
  user: { id: string; displayName: string; createdAt: string };
  recipes: {
    id: string;
    title: string;
    description?: string | null;
    imagePath?: string | null;
    isPublic?: boolean;
    ownerId: string;
    ownerName?: string | null;
    updatedAt: string;
  }[];
};

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [data, setData] = React.useState<ProfileData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await apiFetch(`/api/users/${id}`);
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        const j = await r.json();
        setData(j);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Not found.</p>;

  const isMe = user?.id === data.user.id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{data.user.displayName}</h2>
        <Link to="/recipes" className="underline">← Back to list</Link>
      </div>
      <div className="text-sm text-gray-500">
        {isMe ? 'Your profile' : 'User profile'} · Member since {new Date(data.user.createdAt).toLocaleDateString()}
      </div>

      <h3 className="font-semibold mt-4">Recipes</h3>
      {data.recipes.length === 0 ? (
        <p>No recipes yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.recipes.map((r) => (
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
                <div className="text-sm text-gray-500">{r.isPublic ? 'Public' : 'Private'}</div>
                {r.description && <p className="text-sm text-gray-700 line-clamp-2 mt-1">{r.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
