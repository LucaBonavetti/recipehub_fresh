import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import './index.css';

import App from './App';
import { AuthProvider } from './auth/AuthProvider';

import Recipes from './pages/Recipes';
import RecipeDetails from './pages/RecipeDetails';
import RecipeForm from './pages/RecipeForm';
import Login from './pages/Login';
import Register from './pages/Register';

function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Welcome to RecipeHub</h2>
      <p className="text-gray-600">Collect, view and share your favorite recipes.</p>
      <div className="flex gap-3">
        <Link className="underline" to="/recipes">Browse recipes</Link>
        <Link className="underline" to="/recipes/new">Create recipe</Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <Link className="underline" to="/recipes">Go to recipes</Link>
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
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
