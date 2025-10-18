import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
  servings?: number | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
};

export default function RecipeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = React.useState<Recipe | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        setR(await res.json());
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [id]);

  async function remove() {
    if (!id) return;
    if (!confirm('Delete this recipe?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      navigate('/recipes');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setDeleting(false);
    }
  }

  if (error) return <div className="text-red-600">{error}</div>;
  if (!r) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{r.title}</h2>
        <div className="flex gap-2">
          <Link to={`/recipes/${r.id}/edit`} className="border rounded px-3 py-2">Edit</Link>
          <button onClick={remove} disabled={deleting} className="border rounded px-3 py-2 text-red-600">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {r.description && <p className="text-gray-700 whitespace-pre-line">{r.description}</p>}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-2">Ingredients</h3>
          {r.ingredients && r.ingredients.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {r.ingredients.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          ) : <div className="text-gray-500">—</div>}
        </div>

        <div className="md:col-span-2">
          <h3 className="font-semibold mb-2">Steps</h3>
          {r.steps && r.steps.length > 0 ? (
            <ol className="list-decimal pl-5 space-y-1">
              {r.steps.map((line, i) => <li key={i}>{line}</li>)}
            </ol>
          ) : <div className="text-gray-500">—</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <div><span className="font-medium">Servings:</span> {r.servings ?? '—'}</div>
        <div><span className="font-medium">Prep:</span> {r.prepMinutes ?? '—'} min</div>
        <div><span className="font-medium">Cook:</span> {r.cookMinutes ?? '—'} min</div>
      </div>

      {r.tags && r.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.tags.map((t) => <span key={t} className="text-xs bg-gray-100 border rounded px-2 py-0.5">{t}</span>)}
        </div>
      )}
    </div>
  );
}
