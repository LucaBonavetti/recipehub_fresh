import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';

type RecipeIn = {
  title: string;
  description?: string | null;
  ingredients: string[];
  steps: string[];
  tags: string[];
  servings?: number | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  isPublic: boolean;
  imagePath?: string | null;
  sourceUrl?: string | null;
};

type Recipe = RecipeIn & { id: string };

export default function RecipeForm() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);

  const [form, setForm] = React.useState<RecipeIn>({
    title: '',
    description: '',
    ingredients: [],
    steps: [],
    tags: [],
    servings: 1,
    prepMinutes: null,
    cookMinutes: null,
    isPublic: true,
    imagePath: null,
    sourceUrl: null,
  });

  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(editing);

  React.useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/recipes/${id}`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data: Recipe = await res.json();
        setForm({
          title: data.title,
          description: data.description ?? '',
          ingredients: data.ingredients ?? [],
          steps: data.steps ?? [],
          tags: data.tags ?? [],
          servings: data.servings ?? null,
          prepMinutes: data.prepMinutes ?? null,
          cookMinutes: data.cookMinutes ?? null,
          isPublic: data.isPublic ?? true,
          imagePath: data.imagePath ?? null,
          sourceUrl: data.sourceUrl ?? null,
        });
        setImagePreview(data.imagePath ?? null);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id]);

  function set<K extends keyof RecipeIn>(key: K, val: RecipeIn[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function uploadIfNeeded(): Promise<string | null | undefined> {
    if (!file) return form.imagePath ?? null;
    const body = new FormData();
    body.append('file', file);
    const res = await apiFetch('/api/uploads/image', { method: 'POST', body });
    if (!res.ok) throw new Error(`Image upload failed (${res.status})`);
    const j = await res.json();
    return j.path as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      // 1) upload image if provided
      const imagePath = await uploadIfNeeded();

      // 2) build payload
      const payload: RecipeIn = {
        ...form,
        imagePath: imagePath ?? null,
        // normalize textareas
        ingredients: (Array.isArray(form.ingredients) ? form.ingredients : (form.ingredients ?? []))
          .map(String).map((s) => s.trim()).filter(Boolean),
        steps: (Array.isArray(form.steps) ? form.steps : (form.steps ?? []))
          .map(String).map((s) => s.trim()).filter(Boolean),
        tags: (Array.isArray(form.tags) ? form.tags : (form.tags ?? []))
          .map((s) => s.trim()).filter(Boolean),
      };

      // 3) send create/update with apiFetch (sends cookies)
      const res = await apiFetch(editing ? `/api/recipes/${id}` : '/api/recipes', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${editing ? 'Save' : 'Create'} failed (${res.status})`);
      const saved: Recipe = await res.json();

      // 4) go to details (RecipeDetails also uses apiFetch, so cookie will be sent)
      nav(`/recipes/${saved.id}`);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function onFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0] ?? null;
    setFile(f);
    setImagePreview(f ? URL.createObjectURL(f) : form.imagePath ?? null);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-semibold">{editing ? 'Edit Recipe' : 'Create Recipe'}</h2>
      {err && <div className="text-red-600">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="border rounded px-3 py-2 w-full"
                 value={form.title}
                 onChange={(e)=>set('title', e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="border rounded px-3 py-2 w-full min-h-[100px]"
                    value={form.description ?? ''} onChange={(e)=>set('description', e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Ingredients (one per line)</label>
            <textarea className="border rounded px-3 py-2 w-full min-h-[160px]"
              value={(form.ingredients ?? []).join('\n')}
              onChange={(e)=>set('ingredients', e.target.value.split('\n'))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Steps (one per line)</label>
            <textarea className="border rounded px-3 py-2 w-full min-h-[160px]"
              value={(form.steps ?? []).join('\n')}
              onChange={(e)=>set('steps', e.target.value.split('\n'))} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Tags (comma separated)</label>
          <input className="border rounded px-3 py-2 w-full"
                 value={(form.tags ?? []).join(', ')}
                 onChange={(e)=>set('tags', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Servings</label>
            <input type="number" min={1} className="border rounded px-3 py-2 w-full"
                   value={form.servings ?? 1}
                   onChange={(e)=>set('servings', Number(e.target.value) || 1)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Prep minutes</label>
            <input type="number" min={0} className="border rounded px-3 py-2 w-full"
                   value={form.prepMinutes ?? 0}
                   onChange={(e)=>set('prepMinutes', Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Cook minutes</label>
            <input type="number" min={0} className="border rounded px-3 py-2 w-full"
                   value={form.cookMinutes ?? 0}
                   onChange={(e)=>set('cookMinutes', Number(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Source URL</label>
          <input className="border rounded px-3 py-2 w-full"
                 value={form.sourceUrl ?? ''}
                 onChange={(e)=>set('sourceUrl', e.target.value || null)} />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublic} onChange={(e)=>set('isPublic', e.target.checked)} />
            <span>Public</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Image (max 2 MB)</label>
          <input type="file" accept="image/*" onChange={onFileChange} />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-52 h-52 object-cover border rounded" />
          )}
        </div>

        <div className="flex gap-2">
          <button className="border rounded px-4 py-2" disabled={saving}>
            {saving ? (editing ? 'Saving…' : 'Creating…') : (editing ? 'Save' : 'Create')}
          </button>
          <button type="button" className="border rounded px-4 py-2" onClick={()=>nav(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
