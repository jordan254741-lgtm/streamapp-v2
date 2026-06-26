import { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, Volume2Icon, Maximize2Icon, SkipBackIcon, SkipForwardIcon, VolumeXIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  sources?: Array<{ src: string; type: string; label?: string }>;
  poster?: string;
  title?: string;
  youtubeKey?: string;
  dailymotionUrl?: string;
}

interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleFullscreen: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ 
  sources = [], 
  poster, 
  title, 
  youtubeKey,
  dailymotionUrl,
  className, 
  ...props 
}, _ref) => {
  void _ref;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [cacheProgress, setCacheProgress] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const loadProgress = useCallback(() => {
    if (title) {
      const saved = localStorage.getItem(`video-progress-${title}`);
      if (saved) {
        const { time, volume: savedVolume, muted } = JSON.parse(saved);
        setCurrentTime(time);
        setVolume(savedVolume || 0.8);
        setIsMuted(muted || false);
      }
    }
  }, [title]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const saveProgress = useCallback(() => {
    if (title && currentTime > 0) {
      localStorage.setItem(`video-progress-${title}`, JSON.stringify({
        time: currentTime,
        volume,
        muted: isMuted,
        timestamp: Date.now(),
      }));
    }
  }, [title, currentTime, volume, isMuted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveProgress();
      } else {
        loadProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveProgress, loadProgress]);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
        setCacheProgress(false);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;
    
    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          seek(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          setIsMuted(!isMuted);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, duration, volume, isMuted, togglePlay, toggleFullscreen, seek]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setCacheProgress(progress > 80);
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  if (dailymotionUrl) {
    return (
      <div ref={playerRef} className={cn('relative w-full bg-black rounded-lg overflow-hidden', className)}>
        <iframe
          src={`${dailymotionUrl}?autoplay=1`}
          title={title}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
        </div>
      </div>
    );
  }

  if (youtubeKey) {
    return (
      <div ref={playerRef} className={cn('relative w-full bg-black rounded-lg overflow-hidden', className)}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
          title={title}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
        </div>
      </div>
    );
  }

  return (
    <div ref={playerRef} className={cn('relative group w-full bg-black', className)} onClick={togglePlay} onMouseMove={showControlsTemporarily}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        {...props}
      >
        {sources.map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        Your browser does not support the video tag.
      </video>

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
        <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
      </div>

      <div className={cn('absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10 transition-opacity duration-300', showControls ? 'opacity-100' : 'opacity-0')}>        
        <div className="relative mb-4">
          <div ref={progressBarRef} className="w-full h-1 bg-gray-600 rounded-full cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent * duration);
          }}>
            <div 
              className={cn('h-full bg-white rounded-full relative transition-all', cacheProgress && 'bg-green-400')}
              style={{ width: `${progressPercentage}%` }}
            >
              {cacheProgress && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            </button>
            
            <button onClick={(e) => { e.stopPropagation(); seek(Math.max(0, currentTime - 10)); }} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" aria-label="Rewind 10 seconds">
              <SkipBackIcon className="h-4 w-4" />
            </button>
            
            <button onClick={(e) => { e.stopPropagation(); seek(Math.min(duration, currentTime + 10)); }} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" aria-label="Forward 10 seconds">
              <SkipForwardIcon className="h-4 w-4" />
            </button>

            <div className="relative flex items-center space-x-2 ml-2">
              <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-1 bg-gray-600 rounded-full cursor-pointer"
                aria-label="Volume"
              />
            </div>

            <div className="text-white text-sm font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <Maximize2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {!isPlaying && showControls && (
        <div className="absolute bottom-4 right-4 z-20">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30 transition-all" aria-label="Play">
            <PlayIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-4 left-4 z-20">
          <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm">
            Theater Mode
          </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
