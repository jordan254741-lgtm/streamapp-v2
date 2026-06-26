import { Link, useNavigation, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === 'loading';
  const [activePath, setActivePath] = useState(location.pathname);

  const links = [
    { path: '/browse', label: 'Browse' },
    { path: '/requests', label: 'Requests' },
    { path: '/downloads', label: 'Downloads' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/browse" className="text-white font-bold text-lg tracking-tight">
            StreamApp
          </Link>
          <div className="flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition-colors ${
                  activePath === link.path
                    ? 'text-white font-medium'
                    : 'text-gray-300 hover:text-white'
                } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                onClick={() => !isLoading && setActivePath(link.path)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800" role="progressbar" aria-label="Navigation loading">
            <div className="h-full bg-white animate-pulse transition-all duration-300" style={{ width: '50%' }} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
