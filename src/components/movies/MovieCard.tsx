import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadManager, useActiveDownloads } from '@/hooks/useDownloadManager';
import { resolveMovieFile, downloadAndSave } from '@/lib/downloadService';
import { DownloadIcon, CheckIcon, XIcon } from 'lucide-react';
import type { Movie, QualityOption } from '@/types';

interface MovieCardProps {
  movie: Movie;
  isLoading?: boolean;
  onClick?: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
};

const MovieCardSkeleton: React.FC = () => (
  <div className="w-full group cursor-pointer">
    <Skeleton className="aspect-[2/3] w-full rounded-xl mb-2.5" />
    <Skeleton className="h-4 w-3/4 mb-1.5 rounded-md" />
    <Skeleton className="h-3 w-1/2 rounded-md" />
  </div>
);

const MovieCard: React.FC<MovieCardProps> = ({ movie, isLoading, onClick }) => {
  const [downloadQuality] = useState<QualityOption>('720p');
  const tasks = useActiveDownloads();
  const year = movie.release_date ? parseInt(movie.release_date.split('-')[0], 10) : undefined;

  const activeTask = tasks.find(
    (t) => t.title === movie.title && t.quality === downloadQuality && t.status !== 'error' && t.status !== 'cancelled',
  );
  const doneTask = tasks.find(
    (t) => t.title === movie.title && t.quality === downloadQuality && t.status === 'done',
  );

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTask) return;

    const taskId = downloadManager.begin({ title: movie.title, quality: downloadQuality });
    const controller = downloadManager.getController(taskId);

    (async () => {
      try {
        const resolved = await resolveMovieFile({ title: movie.title, year, quality: downloadQuality });
        if (!controller || controller.signal.aborted) return;

        await downloadAndSave(resolved, movie.title, downloadQuality, {
          signal: controller.signal,
          onStage: (stage) => downloadManager.setStatus(taskId, stage),
          onProgress: (receivedBytes, totalBytes) =>
            downloadManager.setProgress(taskId, receivedBytes, totalBytes),
        });

        downloadManager.setStatus(taskId, 'done');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          downloadManager.cancel(taskId);
          return;
        }
        downloadManager.fail(
          taskId,
          err instanceof Error ? err.message : 'Download failed.',
        );
      }
    })();
  };

  const cancelDownload = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    downloadManager.cancel(taskId);
  };

  if (isLoading) {
    return <MovieCardSkeleton />;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750/111/333?text=No+Image';

  const yearStr = movie.release_date?.split('-')[0] ?? 'N/A';
  const rating = movie.vote_average?.toFixed(1) ?? 'N/A';

  return (
    <Card
      className="w-full bg-transparent border-0 text-white overflow-hidden shadow-none hover:shadow-none cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-xl">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-xs text-neutral-300 line-clamp-2">{movie.overview?.slice(0, 80)}...</p>
        </div>
        <div className="absolute top-2.5 right-2.5 bg-black/60 glass-subtle backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
          <span className="text-amber-400 text-[10px]">★</span>
          {rating}
        </div>
        {movie.vote_average && movie.vote_average >= 7.5 && (
          <div className="absolute top-2.5 left-2.5 bg-white/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            Popular
          </div>
        )}

        {/* Download overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {activeTask ? (
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-3 w-[90%] max-w-[160px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] text-neutral-300 truncate">
                  {activeTask.status === 'downloading' && activeTask.totalBytes > 0
                    ? `${Math.round((activeTask.receivedBytes / activeTask.totalBytes) * 100)}%`
                    : activeTask.receivedBytes > 0
                      ? formatBytes(activeTask.receivedBytes)
                      : 'Downloading...'}
                </span>
                <button onClick={(e) => cancelDownload(e, activeTask.id)} className="text-neutral-500 hover:text-red-400 shrink-0">
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
              <div className="h-1 rounded-full bg-white/[0.12] overflow-hidden">
                {activeTask.totalBytes > 0 ? (
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(activeTask.receivedBytes / activeTask.totalBytes) * 100}%` }}
                  />
                ) : (
                  <div className="h-full w-1/2 rounded-full bg-emerald-400/70 animate-pulse" />
                )}
              </div>
            </div>
          ) : doneTask ? (
            <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg">
              <CheckIcon className="h-3.5 w-3.5" />
              Saved
            </span>
          ) : (
            <button
              onClick={handleDownload}
              className="bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <DownloadIcon className="h-4 w-4" />
              Download
            </button>
          )}
        </div>
      </div>
      <CardContent className="p-2 px-0">
        <h3 className="text-sm font-semibold truncate text-white/90 group-hover:text-white transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">{yearStr}</p>
      </CardContent>
    </Card>
  );
};

export default MovieCard;
