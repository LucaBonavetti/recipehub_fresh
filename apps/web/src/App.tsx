import { Outlet, NavLink } from 'react-router-dom';
import { getViewer } from './lib/auth';

export default function App() {
  const v = getViewer();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">RecipeHub</h1>
            <nav className="flex gap-4 text-sm">
              <NavLink to="/" className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`} end>
                Home
              </NavLink>
              <NavLink to="/recipes" className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`}>
                Recipes
              </NavLink>
              <NavLink to="/account" className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`}>
                Account
              </NavLink>
            </nav>
          </div>
          <div className="text-sm text-gray-600">Signed in as <span className="font-medium">{v.name}</span></div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center text-sm text-gray-500">
          © {new Date().getFullYear()} RecipeHub
        </div>
      </footer>
    </div>
  );
}
