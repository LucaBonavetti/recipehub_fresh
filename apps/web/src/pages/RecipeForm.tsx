import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthProvider';

type RecipeIn = {
  title: string;
  description?: string | null;
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
  servings?: number | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  imagePath?: string | null;
  sourceUrl?: string | null;
  isPublic?: boolean;
};

function toLines(v?: string[] | null) {
  return Array.isArray(v) ? v.join('\n') : '';
}
function toArray(v: string) {
  return v
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function RecipeForm() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [data, setData] = React.useState<RecipeIn>({
    title: '',
    description: '',
    ingredients: [],
    steps: [],
    tags: [],
    servings: null,
    prepMinutes: null,
    cookMinutes: null,
    imagePath: null,
    sourceUrl: null,
    isPublic: true,
  });

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const r = await apiFetch(`/api/recipes/${id}`);
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        const j = await r.json();
        setData({
          title: j.title ?? '',
          description: j.description ?? '',
          ingredients: j.ingredients ?? [],
          steps: j.steps ?? [],
          tags: j.tags ?? [],
          servings: j.servings ?? null,
          prepMinutes: j.prepMinutes ?? null,
          cookMinutes: j.cookMinutes ?? null,
          imagePath: j.imagePath ?? null,
          sourceUrl: j.sourceUrl ?? null,
          isPublic: j.isPublic ?? true,
        });
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [isEdit, id]);

  async function uploadImageIfNeeded(): Promise<string | null | undefined> {
    if (!imageFile) return data.imagePath ?? null;
    const form = new FormData();
    form.append('file', imageFile);
    const r = await apiFetch('/api/uploads', { method: 'POST', body: form });
    if (!r.ok) throw new Error(`Upload failed (${r.status})`);
    const j = await r.json();
    return j.path as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please login first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const imagePath = await uploadImageIfNeeded();
      const payload: RecipeIn = {
        ...data,
        imagePath: imagePath ?? null,
        ingredients: toArray((document.getElementById('ingredients') as HTMLTextAreaElement).value),
        steps: toArray((document.getElementById('steps') as HTMLTextAreaElement).value),
        tags: toArray((document.getElementById('tags') as HTMLTextAreaElement).value),
      };

      const url = isEdit ? `/api/recipes/${id}` : '/api/recipes';
      const method = isEdit ? 'PATCH' : 'POST';
      const r = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`${isEdit ? 'Update' : 'Create'} failed (${r.status})`);
      const j = await r.json();
      nav(`/recipes/${j.id}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{isEdit ? 'Edit recipe' : 'Create recipe'}</h2>
        <Link to="/recipes" className="underline">
          ← Back to list
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="border rounded px-2 py-1 w-full min-h-[80px]"
            value={data.description ?? ''}
            onChange={(e) => setData({ ...data, description: e.target.value })}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Servings</label>
            <input
              type="number"
              min={1}
              className="border rounded px-2 py-1 w-full"
              value={data.servings ?? ''}
              onChange={(e) =>
                setData({ ...data, servings: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Prep (min)</label>
            <input
              type="number"
              min={0}
              className="border rounded px-2 py-1 w-full"
              value={data.prepMinutes ?? ''}
              onChange={(e) =>
                setData({ ...data, prepMinutes: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Cook (min)</label>
            <input
              type="number"
              min={0}
              className="border rounded px-2 py-1 w-full"
              value={data.cookMinutes ?? ''}
              onChange={(e) =>
                setData({ ...data, cookMinutes: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Ingredients (one per line)</label>
          <textarea
            id="ingredients"
            className="border rounded px-2 py-1 w-full min-h-[120px]"
            defaultValue={toLines(data.ingredients)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Steps (one per line)</label>
          <textarea
            id="steps"
            className="border rounded px-2 py-1 w-full min-h-[120px]"
            defaultValue={toLines(data.steps)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (one per line)</label>
          <textarea
            id="tags"
            className="border rounded px-2 py-1 w-full min-h-[60px]"
            defaultValue={toLines(data.tags)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Source URL</label>
          <input
            type="url"
            className="border rounded px-2 py-1 w-full"
            value={data.sourceUrl ?? ''}
            onChange={(e) => setData({ ...data, sourceUrl: e.target.value || null })}
            placeholder="https://example.com/blog/recipe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          {data.imagePath && !imageFile && (
            <div className="mt-2">
              <img src={data.imagePath} alt="" className="w-32 h-32 object-cover rounded" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isPublic"
            type="checkbox"
            checked={Boolean(data.isPublic)}
            onChange={(e) => setData({ ...data, isPublic: e.target.checked })}
          />
          <label htmlFor="isPublic">Public</label>
        </div>

        <div className="flex gap-3">
          <button
            className="border rounded px-4 py-1"
            type="submit"
            disabled={saving}
          >
            {saving ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save' : 'Create'}
          </button>
          <Link to="/recipes" className="underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
