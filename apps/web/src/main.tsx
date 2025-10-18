import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import App from './App';
import './index.css';

function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Welcome to RecipeHub</h2>
      <p className="text-gray-600">Fresh start baseline is running.</p>
      <p>
        <Link to="/health" className="text-blue-600 underline">Check API health</Link>
      </p>
    </div>
  );
}

function Health() {
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setData)
      .catch(setErr);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">API Health</h2>
      {err && <pre className="text-red-600">{String(err)}</pre>}
      {data ? <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(data, null, 2)}</pre> : <p>Loading…</p>}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'health', element: <Health /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
