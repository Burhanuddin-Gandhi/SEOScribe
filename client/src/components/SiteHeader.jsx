import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function SiteHeader({ onReset }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleHomeClick = (e) => {
    e.preventDefault();
    onReset?.();
    navigate('/');
  };

  const navLink = (to, label) => {
    const isActive = location.pathname === to;
    if (to === '/') {
      return (
        <button
          type="button"
          onClick={handleHomeClick}
          className={`text-sm font-medium transition-colors cursor-pointer ${
            isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      );
    }
    return (
      <Link
        to={to}
        className={`text-sm font-medium transition-colors ${
          isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-gray-800/50">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-gray-100 transition-colors">
            SEO<span className="text-violet-400">Scribe</span>
          </h1>
        </Link>

        <nav className="flex items-center gap-6">
          {navLink('/', 'Analyzer')}
          {navLink('/methodology', 'How We Verify Data')}
          <span className="text-xs font-medium text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
            v1.0 MVP
          </span>
        </nav>
      </div>
    </header>
  );
}