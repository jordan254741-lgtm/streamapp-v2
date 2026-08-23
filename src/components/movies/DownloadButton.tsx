import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAddDownload, useCheckDownload } from '@/hooks/useDownloads';
import { downloadManager, useActiveDownloads } from '@/hooks/useDownloadManager';
import { resolveMovieFile, downloadAndSave } from '@/lib/downloadService';
import { DownloadIcon, CheckIcon, XIcon, AlertCircleIcon } from 'lucide-react';
import type { QualityOption } from '@/types';

interface DownloadButtonProps {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  year?: number;
}

const qualities: readonly QualityOption[] = ['480p', '720p', '1080p'];

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(bytes / 1024))} KB`;
};

const statusLabel: Record<string, string> = {
  resolving: 'Finding source...',
  connecting: 'Connecting...',
  downloading: 'Downloading',
  saving: 'Saving to file...',
};

const DownloadButton = ({ tmdbId, title, posterUrl, year }: DownloadButtonProps) => {
  const [quality, setQuality] = useState<QualityOption>('720p');
  const addDownload = useAddDownload();
  const { data: isDownloaded, isLoading: isChecking } = useCheckDownload(tmdbId);
  const tasks = useActiveDownloads();

  const activeTask = tasks.find(
    (t) => t.title === title && t.quality === quality && t.status !== 'error' && t.status !== 'cancelled',
  );
  const failedTask = tasks.find((t) => t.title === title && t.quality === quality && t.status === 'error');

  const handleDownload = () => {
    if (activeTask) return;
    const taskId = downloadManager.begin({ title, quality });
    const controller = downloadManager.getController(taskId);

    (async () => {
      try {
        const resolved = await resolveMovieFile({ title, year, quality });
        if (!controller || controller.signal.aborted) return;

        await downloadAndSave(resolved, title, quality, {
          signal: controller.signal,
          onStage: (stage) => downloadManager.setStatus(taskId, stage),
          onProgress: (receivedBytes, totalBytes) =>
            downloadManager.setProgress(taskId, receivedBytes, totalBytes),
        });

        downloadManager.setStatus(taskId, 'done');
        addDownload.mutate({
          tmdb_id: tmdbId,
          title,
          poster_url: posterUrl,
          quality,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          downloadManager.cancel(taskId);
          return;
        }
        downloadManager.fail(
          taskId,
          err instanceof Error ? err.message : 'Download failed unexpectedly.',
        );
      }
    })();
  };

  const cancelTask = (taskId: string) => downloadManager.cancel(taskId);

  if (isChecking) {
    return <div className="h-9 w-32 rounded-lg bg-white/[0.04] animate-pulse" />;
  }

  if (isDownloaded && !activeTask) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
        <CheckIcon className="h-4 w-4" />
        Saved to files
      </div>
    );
  }

  if (activeTask) {
    const percent =
      activeTask.totalBytes > 0 ? Math.round((activeTask.receivedBytes / activeTask.totalBytes) * 100) : null;
    return (
      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-300 font-medium">
            {statusLabel[activeTask.status] ?? activeTask.status}
            {percent !== null ? ` ${percent}%` : ''}
            {activeTask.receivedBytes > 0 ? ` · ${formatBytes(activeTask.receivedBytes)}` : ''}
          </span>
          <button
            onClick={() => cancelTask(activeTask.id)}
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-red-400 transition-colors"
          >
            <XIcon className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as QualityOption)}
          className="h-9 rounded-lg border border-white/10 bg-white/5 text-white text-sm px-2 outline-none focus-visible:border-white/20 transition-colors"
        >
          {qualities.map((q) => (
            <option key={q} value={q} className="bg-black text-white">{q}</option>
          ))}
        </select>
        <Button
          onClick={handleDownload}
          disabled={addDownload.isPending}
          size="sm"
          variant="outline"
          className="gap-1.5 font-medium"
        >
          <DownloadIcon className="h-4 w-4" />
          Download & Save
        </Button>
      </div>
      {failedTask && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 max-w-sm">
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
          {failedTask.error}
        </p>
      )}
    </div>
  );
};

export default DownloadButton;
