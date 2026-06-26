import { useNavigate } from 'react-router-dom';
import { useDownloads, useDeleteDownload } from '@/hooks/useDownloads';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2Icon, PlayIcon, DownloadIcon } from 'lucide-react';
import type { Download } from '@/types';

const Downloads = () => {
  usePageMeta({ title: 'Downloads', description: 'View and manage your downloaded movies.' });
  const navigate = useNavigate();
  const { data: downloads, isLoading } = useDownloads();
  const deleteDownload = useDeleteDownload();

  const handleDelete = (downloadId: string) => {
    if (window.confirm('Remove this download?')) {
      deleteDownload.mutate(downloadId);
    }
  };

  const handleWatch = (tmdbId: number) => {
    navigate(`/watch/${tmdbId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!downloads || downloads.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Downloads</h1>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <DownloadIcon className="h-16 w-16 text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No downloads yet</p>
            <p className="text-gray-600 text-sm mt-1 max-w-sm">
              Browse movies and download them to watch offline later.
            </p>
            <Button
              onClick={() => navigate('/browse')}
              className="mt-6 bg-white text-black hover:bg-gray-200 font-semibold"
            >
              Browse Movies
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Downloads</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {downloads.map((download: Download) => (
            <div key={download.id} className="group relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
              <div className="aspect-[2/3] relative overflow-hidden">
                {download.poster_url ? (
                  <img
                    src={download.poster_url}
                    alt={download.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <DownloadIcon className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                {download.quality && (
                  <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                    {download.quality}
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="text-sm font-medium text-white truncate">{download.title}</h3>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  onClick={() => handleWatch(download.tmdb_id)}
                  size="icon"
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  <PlayIcon className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => handleDelete(download.id)}
                  size="icon"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <Trash2Icon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Downloads;
