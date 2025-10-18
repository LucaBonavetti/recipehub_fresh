import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';

import App from './App';
import './index.css';

import Recipes from './pages/Recipes';
import RecipeDetails from './pages/RecipeDetails';
import RecipeForm from './pages/RecipeForm';
import Account from './pages/Account';

function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Welcome to RecipeHub</h2>
      <p className="text-gray-700">
        Collect, view and share your favorite recipes. Create a new recipe or browse existing ones.
      </p>
      <div className="flex gap-2">
        <Link to="/recipes" className="border rounded px-3 py-2">Browse recipes</Link>
        <Link to="/recipes/new" className="border rounded px-3 py-2">Create recipe</Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <Link to="/recipes" className="underline">Go to recipes</Link>
    </div>
  );
}

function Health() {
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState<any>(null);
  React.useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setData).catch(setErr);
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
      { path: 'recipes', element: <Recipes /> },
      { path: 'recipes/new', element: <RecipeForm /> },
      { path: 'recipes/:id', element: <RecipeDetails /> },
      { path: 'recipes/:id/edit', element: <RecipeForm /> },
      { path: 'account', element: <Account /> },
      { path: 'health', element: <Health /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
