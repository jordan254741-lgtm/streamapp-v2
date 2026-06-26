import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { VideoSource } from '@/hooks/useVideoSource';

interface PlayerProps {
  sources: VideoSource[];
  title: string;
  onClose?: () => void;
}

type PlayerState = 'loading' | 'playing' | 'error';

const DURATION_TIMEOUT_MS = 15000;

const IframeWithTimeout = ({ src, title }: { src: string; title: string }) => {
  const [state, setState] = useState<PlayerState>('loading');

  useEffect(() => {
    const timer = setTimeout(() => {
      setState('error');
    }, DURATION_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black">
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-neutral-500 text-xs">Loading source...</p>
          </div>
        </div>
      )}
      {state === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black z-10">
          <AlertTriangle className="w-8 h-8 text-neutral-600" />
          <p className="text-sm font-medium text-neutral-400">Source unavailable</p>
          <p className="text-xs text-neutral-600">Try a different source below</p>
        </div>
      ) : null}
      <iframe
        src={src}
        title={title}
        className={`w-full h-full ${state === 'error' ? 'hidden' : ''}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setState('playing')}
      />
    </div>
  );
};

const VideoPlayer = ({ sources, title, onClose }: PlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSource = sources[currentIndex];

  const goToSource = useCallback((index: number) => {
    if (index >= 0 && index < sources.length) {
      setCurrentIndex(index);
    }
  }, [sources.length]);

  const sourceLabel = currentSource?.source === 'dailymotion' ? 'Dailymotion' : 'Archive';
  const durationLabel = currentSource?.duration
    ? `${Math.floor(currentSource.duration / 60)}min`
    : '';

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative bg-black rounded-2xl overflow-hidden border border-white/[0.06]">
        <IframeWithTimeout
          key={currentSource?.embedUrl}
          src={currentSource?.source === 'dailymotion'
            ? `${currentSource.embedUrl}?autoplay=1&queue-enable=0`
            : `${currentSource?.embedUrl}?autoplay=1`}
          title={currentSource?.title ?? title}
        />

        {currentSource?.isFullMovie && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 text-white text-xs font-semibold rounded-lg backdrop-blur-sm">
              Full Movie
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <div className="bg-black/50 glass-subtle backdrop-blur-md text-white/80 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span>{sourceLabel}</span>
            {durationLabel && <span className="text-white/40">·</span>}
            {durationLabel && <span>{durationLabel}</span>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-black/50 glass-subtle backdrop-blur-md hover:bg-black/70 text-white rounded-full p-1.5 transition-all duration-200"
              aria-label="Close player"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {sources.length > 1 && (
        <div className="mt-4">
          <p className="text-xs text-neutral-600 mb-2.5 font-medium uppercase tracking-widest">Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => (
              <button
                key={source.id}
                onClick={() => goToSource(i)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  i === currentIndex
                    ? 'bg-white text-black border-white font-medium shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                    : 'bg-white/5 text-neutral-400 border-white/[0.08] hover:text-white hover:border-white/20'
                }`}
              >
                {source.source === 'dailymotion' ? 'DM' : 'IA'}
                {' · '}
                {source.isFullMovie ? 'Full' : source.duration > 0 ? `${Math.floor(source.duration / 60)}m` : 'Clip'}
                {source.views > 0 && <span className="text-neutral-600 ml-1">+{source.views}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
