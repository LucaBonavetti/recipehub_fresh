import { Outlet, Link, NavLink } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold">RecipeHub</Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" end className={({isActive}) => isActive ? 'font-semibold' : ''}>Home</NavLink>
            <NavLink to="/health" className={({isActive}) => isActive ? 'font-semibold' : ''}>Health</NavLink>
          </nav>
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
