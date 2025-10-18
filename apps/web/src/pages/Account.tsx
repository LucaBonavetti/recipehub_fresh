import React from 'react';
import { getViewer, setViewerName } from '../lib/auth';

export default function Account() {
  const v = getViewer();
  const [name, setName] = React.useState<string>(v.name);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setViewerName(name.trim() || 'You');
    alert('Name saved.');
  }

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Account</h2>
      <div className="text-sm text-gray-600">Viewer ID: <code>{v.id}</code></div>
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Display name</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="border rounded px-3 py-2">Save</button>
      </form>
    </div>
  );
}
