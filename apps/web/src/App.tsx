import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';

export default function App() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">RecipeHub</h1>
            <nav className="flex gap-4 text-sm">
              <NavLink to="/" end className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`}>
                Home
              </NavLink>
              <NavLink to="/recipes" className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`}>
                Recipes
              </NavLink>
              {user && (
                <>
                  <NavLink to="/favorites" className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`}>
                    Favorites
                  </NavLink>
                  <NavLink to={`/users/${user.id}`} className={({ isActive }) => `hover:underline ${isActive ? 'font-semibold' : ''}`}>
                    Profile
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-gray-600">Hello, {user.displayName}</span>
                <button className="text-red-600 hover:underline" onClick={async () => { await logout(); nav('/'); }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="hover:underline" onClick={() => nav('/login')}>
                  Login
                </button>
                <button className="hover:underline" onClick={() => nav('/register')}>
                  Register
                </button>
              </>
            )}
          </div>
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
