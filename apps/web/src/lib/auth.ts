// Super-light identity persisted in localStorage.
// Not secure; just enough to support "ownership" in this project.

type Viewer = { id: string; name: string };

const ID_KEY = 'viewer.id';
const NAME_KEY = 'viewer.name';

function uuid(): string {
  // Simple UUID v4-ish
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

export function getViewer(): Viewer {
  let id = localStorage.getItem(ID_KEY) || '';
  if (!id) {
    id = uuid();
    localStorage.setItem(ID_KEY, id);
  }
  const name = localStorage.getItem(NAME_KEY) || 'You';
  return { id, name };
}

export function setViewerName(name: string) {
  localStorage.setItem(NAME_KEY, name || 'You');
}

export function viewerHeaders(): HeadersInit {
  const v = getViewer();
  return {
    'x-viewer-id': v.id,
    'x-viewer-name': v.name,
  };
}
