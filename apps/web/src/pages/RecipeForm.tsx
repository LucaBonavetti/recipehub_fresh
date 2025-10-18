import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinLines(arr?: string[]) {
  return (arr ?? []).join('\n');
}
function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinTags(arr?: string[]) {
  return (arr ?? []).join(', ');
}

export default function RecipeForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // form fields
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [ingredients, setIngredients] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [servings, setServings] = React.useState<number | ''>('');
  const [prepMinutes, setPrepMinutes] = React.useState<number | ''>('');
  const [cookMinutes, setCookMinutes] = React.useState<number | ''>('');

  // load existing when editing
  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setError(null);
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const r: Recipe = await res.json();
        setTitle(r.title);
        setDescription(r.description ?? '');
        setIngredients(joinLines(r.ingredients));
        setSteps(joinLines(r.steps));
        setTags(joinTags(r.tags));
        setServings(r.servings ?? '');
        setPrepMinutes(r.prepMinutes ?? '');
        setCookMinutes(r.cookMinutes ?? '');
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [id, isEdit]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        ingredients: parseLines(ingredients),
        steps: parseLines(steps),
        tags: parseTags(tags),
        servings: servings === '' ? null : Number(servings),
        prepMinutes: prepMinutes === '' ? null : Number(prepMinutes),
        cookMinutes: cookMinutes === '' ? null : Number(cookMinutes),
      };

      const url = isEdit ? `/api/recipes/${id}` : `/api/recipes`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to ${isEdit ? 'save' : 'create'} (${res.status})`);
      const saved: Recipe = await res.json();
      navigate(`/recipes/${saved.id}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit recipe' : 'Create recipe'}</h2>

      {error && <div className="text-red-600">{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="border rounded px-3 py-2 w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="border rounded px-3 py-2 w-full min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Ingredients (one per line)</label>
            <textarea className="border rounded px-3 py-2 w-full min-h-40" value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Steps (one per line)</label>
            <textarea className="border rounded px-3 py-2 w-full min-h-40" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Tags (comma-separated)</label>
          <input className="border rounded px-3 py-2 w-full" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Servings</label>
            <input type="number" min={1} className="border rounded px-3 py-2 w-full" value={servings} onChange={(e) => setServings(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Prep (min)</label>
            <input type="number" min={0} className="border rounded px-3 py-2 w-full" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Cook (min)</label>
            <input type="number" min={0} className="border rounded px-3 py-2 w-full" value={cookMinutes} onChange={(e) => setCookMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="border rounded px-4 py-2" disabled={loading || !title.trim()}>
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
}
