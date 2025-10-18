import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthProvider';

// quantity helpers (same as before)
function trimZeros(n: number, maxDecimals = 2) { const s = n.toFixed(maxDecimals); return s.replace(/\.?0+$/, ''); }
function parseLeadingQuantity(text: string){const s=text.trimStart();const p=text.length-s.length;let m=s.match(/^(\d+)\s+(\d+)\/(\d+)(\b|[^0-9/])/);if(m){const w=+m[1],a=+m[2],b=+m[3];if(b)return{value:w+a/b,length:p+m[0].length-m[4].length};}m=s.match(/^(\d+)\/(\d+)(\b|[^0-9/])/);if(m){const a=+m[1],b=+m[2];if(b)return{value:a/b,length:p+m[0].length-m[3].length};}m=s.match(/^(\d+(?:\.\d+)?)(\b|[^0-9.])/);if(m){const v=parseFloat(m[1]);if(!Number.isNaN(v))return{value:v,length:p+m[0].length-m[2].length};}m=s.match(/^(\d+(?:\.\d+)?)$/);if(m){const v=parseFloat(m[1]);if(!Number.isNaN(v))return{value:v,length:p+m[0].length};}return null;}
function parseLeadingRange(text: string){const s=text.trimStart();const p=text.length-s.length;const m=s.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*[-–]\s*(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(\b|[^0-9/.\s])?/);if(!m)return null;const toN=(t:string)=>{const mx=t.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(mx)return +mx[1]+(+mx[3]?+mx[2]/+mx[3]:0);const fx=t.match(/^(\d+)\/(\d+)$/);if(fx)return +fx[1]/+fx[2];return parseFloat(t)};const a=toN(m[1]),b=toN(m[2]);if([a,b].some(Number.isNaN))return null;return{a,b,length:p+m[0].length-(m[3]?.length??0)};}
function scaleIngredientLine(line:string,factor:number){const t=line.trim();if(!t)return line;const r=parseLeadingRange(t);if(r){const rest=t.slice(r.length).trimStart();return `${trimZeros(r.a*factor)}–${trimZeros(r.b*factor)} ${rest}`.trim();}const q=parseLeadingQuantity(t);if(q){const rest=t.slice(q.length).trimStart();return `${trimZeros(q.value*factor)} ${rest}`.trim();}return line;}
function scaleIngredients(lines?:string[],factor?:number){if(!Array.isArray(lines)||!factor||factor===1)return lines??[];return lines.map(l=>scaleIngredientLine(l,factor));}

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
  sourceUrl?: string | null;
  isPublic?: boolean;
  ownerId?: string | null;
  ownerName?: string | null;
};

export default function RecipeDetails() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [r, setR] = React.useState<Recipe | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [targetServings, setTargetServings] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/recipes/${id}`);
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
      const res = await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
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

  const isOwner = user && r.ownerId === user.id;

  const baseServings = r.servings ?? 1;
  const curServings = targetServings ?? baseServings;
  const factor = baseServings > 0 ? curServings / baseServings : 1;
  const scaledIngredients = scaleIngredients(r.ingredients, factor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{r.title}</h2>
          <span className={`px-1.5 py-0.5 rounded border text-xs ${r.isPublic ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
            {r.isPublic ? 'Public' : 'Private'}
          </span>
          {r.ownerName && <span className="text-sm text-gray-600">by {isOwner ? 'you' : r.ownerName}</span>}
        </div>
        <div className="flex gap-2">
          {isOwner && <Link to={`/recipes/${r.id}/edit`} className="border rounded px-3 py-2">Edit</Link>}
          {isOwner && <button onClick={remove} disabled={deleting} className="border rounded px-3 py-2 text-red-600">{deleting ? 'Deleting…' : 'Delete'}</button>}
        </div>
      </div>

      {r.imagePath && (
        <img src={r.imagePath} alt={r.title} className="w-full max-h-96 object-cover rounded border"
             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      )}

      {r.sourceUrl && (
        <div className="text-sm">
          Source:{' '}
          <a className="text-blue-600 underline break-all" href={r.sourceUrl} target="_blank" rel="noreferrer">
            {r.sourceUrl}
          </a>
        </div>
      )}

      {r.description && <p className="text-gray-700 whitespace-pre-line">{r.description}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="font-medium">Servings:</div>
        <div className="flex items-center gap-2">
          <button className="border rounded px-2 py-1" onClick={() => setTargetServings((v)=>Math.max(1,(v??baseServings)-1))}>–</button>
          <input type="number" min={1} className="border rounded px-2 py-1 w-20 text-center"
                 value={curServings} onChange={(e)=>{const v=Number(e.target.value); if(Number.isFinite(v)&&v>=1) setTargetServings(v);}}/>
          <button className="border rounded px-2 py-1" onClick={()=>setTargetServings((v)=>(v??baseServings)+1)}>+</button>
        </div>
        <button className="border rounded px-2 py-1" onClick={()=>setTargetServings(baseServings)} disabled={curServings===baseServings}>
          Reset to base ({baseServings})
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-2">Ingredients</h3>
          {scaledIngredients?.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {scaledIngredients.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          ) : <div className="text-gray-500">—</div>}
        </div>
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-2">Steps</h3>
          {r.steps?.length ? (
            <ol className="list-decimal pl-5 space-y-1">{r.steps.map((line, i) => <li key={i}>{line}</li>)}</ol>
          ) : <div className="text-gray-500">—</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <div><span className="font-medium">Base servings:</span> {baseServings}</div>
        <div><span className="font-medium">Prep:</span> {r.prepMinutes ?? '—'} min</div>
        <div><span className="font-medium">Cook:</span> {r.cookMinutes ?? '—'} min</div>
      </div>

      {r.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {r.tags.map((t) => <span key={t} className="text-xs bg-gray-100 border rounded px-2 py-0.5">{t}</span>)}
        </div>
      ) : null}
    </div>
  );
}
