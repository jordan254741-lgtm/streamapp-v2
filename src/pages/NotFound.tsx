import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

const NotFound = () => {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
  });
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-bold leading-none tracking-tighter text-white/[0.03] mb-[-40px]">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3 relative z-10">Page Not Found</h1>
        <p className="text-neutral-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
          <Button asChild>
            <Link to="/browse">
              <HomeIcon className="h-4 w-4 mr-2" />
              Browse Movies
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
