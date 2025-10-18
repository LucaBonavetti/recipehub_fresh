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
  imagePath?: string | null;
};

/** ---------- Quantity parsing & scaling helpers ---------- */
function trimZeros(n: number, maxDecimals = 2) {
  const s = n.toFixed(maxDecimals);
  return s.replace(/\.?0+$/, '');
}
function parseLeadingQuantity(text: string): { value: number; length: number } | null {
  const s = text.trimStart();
  const pad = text.length - s.length;
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)(\b|[^0-9/])/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = parseInt(m[2], 10);
    const den = parseInt(m[3], 10);
    if (den !== 0) return { value: whole + num / den, length: pad + m[0].length - m[4].length };
  }
  m = s.match(/^(\d+)\/(\d+)(\b|[^0-9/])/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den !== 0) return { value: num / den, length: pad + m[0].length - m[3].length };
  }
  m = s.match(/^(\d+(?:\.\d+)?)(\b|[^0-9.])/);
  if (m) {
    const val = parseFloat(m[1]);
    if (!Number.isNaN(val)) return { value: val, length: pad + m[0].length - m[2].length };
  }
  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    const val = parseFloat(m[1]);
    if (!Number.isNaN(val)) return { value: val, length: pad + m[0].length };
  }
  return null;
}
function parseLeadingRange(text: string): { a: number; b: number; length: number } | null {
  const s = text.trimStart();
  const pad = text.length - s.length;
  const m = s.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*[-–]\s*(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(\b|[^0-9/.\s])?/);
  if (!m) return null;
  const tokenToNumber = (tok: string): number => {
    const mx = tok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mx) return parseInt(mx[1], 10) + (parseInt(mx[3], 10) ? parseInt(mx[2], 10) / parseInt(mx[3], 10) : 0);
    const fx = tok.match(/^(\d+)\/(\d+)$/);
    if (fx) return parseInt(fx[2], 10) ? parseInt(fx[1], 10) / parseInt(fx[2], 10) : 0;
    return parseFloat(tok);
  };
  const a = tokenToNumber(m[1]);
  const b = tokenToNumber(m[2]);
  if ([a, b].some((v) => Number.isNaN(v))) return null;
  const consumed = pad + m[0].length - (m[3]?.length ?? 0);
  return { a, b, length: consumed };
}
function scaleIngredientLine(line: string, factor: number): string {
  const trimmed = line.trim();
  if (!trimmed) return line;
  const rng = parseLeadingRange(trimmed);
  if (rng) {
    const rest = trimmed.slice(rng.length).trimStart();
    return `${trimZeros(rng.a * factor)}–${trimZeros(rng.b * factor)} ${rest}`.trim();
  }
  const qty = parseLeadingQuantity(trimmed);
  if (qty) {
    const rest = trimmed.slice(qty.length).trimStart();
    return `${trimZeros(qty.value * factor)} ${rest}`.trim();
  }
  return line;
}
function scaleIngredients(lines: string[] | undefined, factor: number): string[] {
  if (!Array.isArray(lines) || factor === 1) return lines ?? [];
  return lines.map((ln) => scaleIngredientLine(ln, factor));
}
/** ------------------------------------------------------- */

export default function RecipeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = React.useState<Recipe | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [targetServings, setTargetServings] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data: Recipe = await res.json();
        setR(data);
        setTargetServings(data.servings ?? 1);
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

  const baseServings = r.servings ?? 1;
  const curServings = targetServings ?? baseServings;
  const factor = baseServings > 0 ? curServings / baseServings : 1;
  const scaledIngredients = scaleIngredients(r.ingredients, factor);

  function dec() { setTargetServings((prev) => Math.max(1, (prev ?? baseServings) - 1)); }
  function inc() { setTargetServings((prev) => (prev ?? baseServings) + 1); }
  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= 1) setTargetServings(v);
  }
  function resetServings() { setTargetServings(baseServings); }

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

      {/* IMAGE */}
      {r.imagePath && (
        <img
          src={r.imagePath}
          alt={r.title}
          className="w-full max-h-96 object-cover rounded border"
        />
      )}

      {r.description && <p className="text-gray-700 whitespace-pre-line">{r.description}</p>}

      {/* Servings scaler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-medium">Servings:</div>
        <div className="flex items-center gap-2">
          <button className="border rounded px-2 py-1" onClick={dec} title="Decrease">–</button>
          <input
            type="number"
            min={1}
            className="border rounded px-2 py-1 w-20 text-center"
            value={curServings}
            onChange={onInput}
          />
          <button className="border rounded px-2 py-1" onClick={inc} title="Increase">+</button>
        </div>
        <button className="border rounded px-2 py-1" onClick={resetServings} disabled={curServings === baseServings}>
          Reset to base ({baseServings})
        </button>
        {r.servings == null && (
          <div className="text-xs text-gray-500">
            Base servings unknown; scaling assumes base = 1.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-2">Ingredients</h3>
          {scaledIngredients && scaledIngredients.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {scaledIngredients.map((line, i) => <li key={i}>{line}</li>)}
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
        <div><span className="font-medium">Base servings:</span> {baseServings}</div>
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
