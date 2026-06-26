import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold mb-4">404</p>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button onClick={() => window.history.back()} variant="outline" className="border-gray-700 text-white hover:bg-gray-800 mr-2">
          Go Back
        </Button>
        <Button asChild className="bg-white text-black hover:bg-gray-200">
          <Link to="/browse">
            <HomeIcon className="h-4 w-4 mr-2" />
            Browse Movies
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
