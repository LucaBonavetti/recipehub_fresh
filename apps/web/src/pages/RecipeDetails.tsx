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

/** ---------- Quantity parsing & scaling helpers ---------- */

/** Trim trailing zeros and dot from a number printed with toFixed */
function trimZeros(n: number, maxDecimals = 2) {
  const s = n.toFixed(maxDecimals);
  return s.replace(/\.?0+$/, '');
}

/** Parse a number possibly written as:
 *  - "1" / "2.5"
 *  - "1/2"
 *  - "1 1/2"
 * Returns numeric value and the length consumed.
 */
function parseLeadingQuantity(text: string): { value: number; length: number } | null {
  const s = text.trimStart();
  const pad = text.length - s.length;

  // Mixed number "W N/D"
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)(\b|[^0-9/])/);
  if (m) {
    const whole = parseInt(m[1], 10);
    const num = parseInt(m[2], 10);
    const den = parseInt(m[3], 10);
    if (den !== 0) {
      const val = whole + num / den;
      return { value: val, length: pad + m[0].length - m[4].length };
    }
  }

  // Fraction "N/D"
  m = s.match(/^(\d+)\/(\d+)(\b|[^0-9/])/);
  if (m) {
    const num = parseInt(m[1], 10);
    const den = parseInt(m[2], 10);
    if (den !== 0) {
      const val = num / den;
      return { value: val, length: pad + m[0].length - m[3].length };
    }
  }

  // Decimal or integer
  m = s.match(/^(\d+(?:\.\d+)?)(\b|[^0-9.])/);
  if (m) {
    const val = parseFloat(m[1]);
    if (!Number.isNaN(val)) {
      return { value: val, length: pad + m[0].length - m[2].length };
    }
  }

  // If string ends right at number (e.g., "2")
  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    const val = parseFloat(m[1]);
    if (!Number.isNaN(val)) {
      return { value: val, length: pad + m[0].length };
    }
  }

  return null;
}

/** Parse a leading range "A - B" or "A–B" and return both numbers and length consumed */
function parseLeadingRange(text: string): { a: number; b: number; length: number } | null {
  const s = text.trimStart();
  const pad = text.length - s.length;

  // capture A, separator, B
  const m = s.match(
    /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*[-–]\s*(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(\b|[^0-9/.\s])?/,
  );
  if (!m) return null;

  // Helper to turn a token into number (handles "1 1/2", "1/2", "1.5")
  const tokenToNumber = (tok: string): number => {
    // mixed number?
    const mx = tok.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mx) {
      const whole = parseInt(mx[1], 10);
      const num = parseInt(mx[2], 10);
      const den = parseInt(mx[3], 10);
      return whole + (den ? num / den : 0);
    }
    // fraction?
    const fx = tok.match(/^(\d+)\/(\d+)$/);
    if (fx) {
      const num = parseInt(fx[1], 10);
      const den = parseInt(fx[2], 10);
      return den ? num / den : 0;
    }
    // decimal/int
    return parseFloat(tok);
  };

  const a = tokenToNumber(m[1]);
  const b = tokenToNumber(m[2]);
  if ([a, b].some((v) => Number.isNaN(v))) return null;

  const consumed = pad + m[0].length - (m[3]?.length ?? 0);
  return { a, b, length: consumed };
}

/** Scale an ingredient line by factor:
 * - If it starts with a range "A-B", scale both.
 * - Else if it starts with a quantity, scale it.
 * - Otherwise return unchanged.
 */
function scaleIngredientLine(line: string, factor: number): string {
  const trimmed = line.trim();
  if (!trimmed) return line;

  // Try range first
  const rng = parseLeadingRange(trimmed);
  if (rng) {
    const rest = trimmed.slice(rng.length).trimStart();
    const aScaled = trimZeros(rng.a * factor);
    const bScaled = trimZeros(rng.b * factor);
    return `${aScaled}–${bScaled} ${rest}`.trim();
  }

  // Then single quantity
  const qty = parseLeadingQuantity(trimmed);
  if (qty) {
    const rest = trimmed.slice(qty.length).trimStart();
    const scaled = trimZeros(qty.value * factor);
    return `${scaled} ${rest}`.trim();
  }

  return line;
}

/** Scales all ingredient lines */
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

  // Servings scaling
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

  function dec() {
    setTargetServings((prev) => Math.max(1, (prev ?? baseServings) - 1));
  }
  function inc() {
    setTargetServings((prev) => (prev ?? baseServings) + 1);
  }
  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= 1) setTargetServings(v);
  }
  function resetServings() {
    setTargetServings(baseServings);
  }

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
