import { useNavigate } from 'react-router-dom';
import { useDownloads, useDeleteDownload } from '@/hooks/useDownloads';
import { downloadManager, useActiveDownloads } from '@/hooks/useDownloadManager';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2Icon, PlayIcon, DownloadIcon, XIcon, LoaderCircleIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import type { Download } from '@/types';

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
};

const ActiveTransfers = () => {
  const tasks = useActiveDownloads();
  if (tasks.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-emerald-400" />
        Transfers
      </h2>
      <div className="space-y-3">
        {tasks.map((task) => {
          const percent =
            task.totalBytes > 0 ? Math.round((task.receivedBytes / task.totalBytes) * 100) : null;
          const isDone = task.status === 'done';
          const isError = task.status === 'error';
          const isSettling = isDone || isError || task.status === 'cancelled';

          return (
            <div
              key={task.id}
              className={`rounded-xl border p-4 transition-colors ${
                isError ? 'border-red-500/20 bg-red-500/[0.04]' : 'border-white/[0.06] bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isDone ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : isError ? (
                    <AlertCircleIcon className="h-5 w-5 text-red-400 shrink-0" />
                  ) : (
                    <LoaderCircleIcon className="h-5 w-5 text-emerald-400 animate-spin shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-neutral-500">
                      {task.quality}
                      {' · '}
                      {isError
                        ? task.error
                        : isDone
                          ? 'Saved to your files'
                          : `${formatBytes(task.receivedBytes)}${task.totalBytes > 0 ? ` / ${formatBytes(task.totalBytes)}` : ''}`}
                    </p>
                  </div>
                </div>
                {!isSettling && (
                  <button
                    onClick={() => downloadManager.cancel(task.id)}
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 shrink-0 transition-colors"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                )}
              </div>
              {!isSettling && (
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  {percent !== null ? (
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  ) : (
                    <div className="h-full w-1/3 rounded-full bg-emerald-400/70 animate-pulse" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

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
        <ActiveTransfers />
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
