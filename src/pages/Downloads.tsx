import { useNavigate } from 'react-router-dom';
import { useDownloads, useDeleteDownload } from '@/hooks/useDownloads';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2Icon, PlayIcon, DownloadIcon } from 'lucide-react';
import type { Download } from '@/types';

const Downloads = () => {
  usePageMeta({
    title: 'Downloads',
    description: 'View and manage your downloaded movies.',
  });
  const navigate = useNavigate();
  const { data: downloads, isLoading } = useDownloads();
  const deleteDownload = useDeleteDownload();

  const handleDelete = (downloadId: string) => {
    if (window.confirm('Remove this download?')) {
      deleteDownload.mutate(downloadId);
    }
  };

  const handleWatch = (tmdbId: number) => {
    navigate(`/movie/${tmdbId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <Skeleton className="h-10 w-48 mb-8 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!downloads || downloads.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Downloads</h1>
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <DownloadIcon className="h-8 w-8 text-neutral-500" />
            </div>
            <p className="text-neutral-300 text-lg font-medium">No downloads yet</p>
            <p className="text-neutral-500 text-sm mt-1 max-w-sm">
              Browse movies and download them to watch offline later.
            </p>
            <Button
              onClick={() => navigate('/browse')}
              className="mt-6 font-semibold"
            >
              Browse Movies
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Downloads</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {downloads.map((download: Download) => (
            <div key={download.id} className="group relative bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
              <div className="aspect-[2/3] relative overflow-hidden">
                {download.poster_url ? (
                  <img
                    src={download.poster_url}
                    alt={download.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
                    <DownloadIcon className="h-8 w-8 text-neutral-600" />
                  </div>
                )}
                {download.quality && (
                  <div className="absolute top-2 right-2 bg-black/60 glass-subtle backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg">
                    {download.quality}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-white/90 truncate">{download.title}</h3>
              </div>
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                <Button
                  onClick={() => handleWatch(download.tmdb_id)}
                  size="icon"
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-xl"
                >
                  <PlayIcon className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => handleDelete(download.id)}
                  size="icon"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 backdrop-blur-sm rounded-xl"
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
