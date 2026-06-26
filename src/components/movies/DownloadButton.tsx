import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAddDownload, useCheckDownload } from '@/hooks/useDownloads';
import { DownloadIcon, CheckIcon } from 'lucide-react';
import type { QualityOption } from '@/types';

interface DownloadButtonProps {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
}

const qualities: readonly QualityOption[] = ['480p', '720p', '1080p'];

const DownloadButton = ({ tmdbId, title, posterUrl }: DownloadButtonProps) => {
  const [quality, setQuality] = useState<QualityOption>('720p');
  const addDownload = useAddDownload();
  const { data: isDownloaded, isLoading: isChecking } = useCheckDownload(tmdbId);

  const handleDownload = () => {
    addDownload.mutate({ tmdb_id: tmdbId, title, poster_url: posterUrl, quality });
  };

  if (isChecking) {
    return (
      <div className="h-9 w-32 rounded-lg bg-white/[0.04] animate-pulse" />
    );
  }

  if (isDownloaded) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
        <CheckIcon className="h-4 w-4" />
        Downloaded
      </div>
    );
  }

  return (
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
        {addDownload.isPending ? 'Saving...' : 'Download'}
      </Button>
    </div>
  );
};

export default DownloadButton;
