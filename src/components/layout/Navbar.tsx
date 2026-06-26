import { Link, useNavigation, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === 'loading';
  const activePath = location.pathname;

  const links = [
    { path: '/browse', label: 'Browse' },
    { path: '/requests', label: 'Requests' },
    { path: '/downloads', label: 'Downloads' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/browse" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              StreamApp
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition-all duration-200 min-h-[44px] flex items-center px-3 py-2 rounded-lg ${
                  activePath === link.path
                    ? 'text-white bg-white/10 font-medium'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5" role="progressbar" aria-label="Navigation loading">
            <div className="h-full bg-white/60 rounded-full transition-all duration-500" style={{ width: '50%' }} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
