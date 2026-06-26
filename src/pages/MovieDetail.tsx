import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useVideoSource } from '@/hooks/useVideoSource';
import { usePageMeta } from '@/hooks/usePageMeta';
import DownloadButton from '@/components/movies/DownloadButton';
import MovieCard from '@/components/movies/MovieCard';
import VideoPlayer from '@/components/ui/VideoPlayer';
import SubmitVideoDialog from '@/components/community/SubmitVideoDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlayIcon, FilmIcon } from 'lucide-react';
import type { Movie, CastMember } from '@/types';
import type { VideoStatus } from '@/hooks/useVideoSource';

const StatusBadge = ({ status }: { status: VideoStatus }) => {
  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Searching...
      </span>
    );
  }
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Available
      </span>
    );
  }
  if (status === 'not-found') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        Not Found
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      Error
    </span>
  );
};

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = id ? parseInt(id) : 0;
  const { movie, videos, cast, similarMovies, isLoading, error } = useMovieDetail({ id: movieId });
  usePageMeta({
    title: movie?.title ?? 'Movie',
    description: movie?.overview,
    image: movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
  });

  const { status, isLoading: isVideoLoading, playableSources, primarySource, trailerSources } = useVideoSource({
    movieId,
    movieTitle: movie?.title ?? '',
    year: movie?.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined,
  });

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const openPlayer = useCallback(() => {
    setIsPlayerOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false);
  }, []);

  const getYouTubeVideos = () =>
    videos.filter((v: { site: string }) => v.site === 'YouTube') || [];

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderSkeleton = () => (
    <div className="min-h-screen bg-black text-white">
      <div className="relative h-[50vh] md:h-[70vh]">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
        <Skeleton className="h-12 w-64 mb-4 rounded-xl" />
        <Skeleton className="h-6 w-48 mb-4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="md:col-span-1">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-32 mb-4 rounded-lg" />
            <Skeleton className="h-4 w-full mb-2 rounded-md" />
            <Skeleton className="h-4 w-full mb-2 rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400">Error: {error.message}</p>
          <Button onClick={() => navigate('/browse')} variant="outline" className="mt-4">
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) return renderSkeleton();
  if (!movie) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-neutral-400">Movie not found.</p>
    </div>
  );

  const showNoVideoState = !isVideoLoading && status === 'not-found';
  const showPlayButton = !isVideoLoading && status === 'available' && playableSources.length > 0;
  const youtubeTrailers = getYouTubeVideos();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Cinematic hero */}
      <div className="relative h-[50vh] md:h-[70vh] w-full">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w1280${movie.poster_path}`}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-tight leading-tight max-w-3xl">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-neutral-300 mb-4">
              <span className="font-medium">{movie.release_date?.split('-')[0]}</span>
              <span className="text-neutral-600">·</span>
              {movie.runtime ? (
                <>
                  <span>{formatRuntime(movie.runtime)}</span>
                  <span className="text-neutral-600">·</span>
                </>
              ) : null}
              {movie.vote_average ? (
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">★</span>
                  {movie.vote_average.toFixed(1)}
                </span>
              ) : null}
            </div>

            {!isVideoLoading && (
              <div className="mb-4">
                <StatusBadge status={status} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {isVideoLoading ? (
                <Button disabled size="lg" className="bg-white/10 text-white/50 font-semibold px-8 cursor-wait">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                    Searching...
                  </span>
                </Button>
              ) : showPlayButton ? (
                <Button onClick={openPlayer} size="glow" className="font-semibold px-8">
                  <PlayIcon className="w-5 h-5 mr-2 shrink-0" />
                  {primarySource?.isFullMovie ? 'Watch Full Movie' : 'Watch'}
                  {playableSources.length > 1 && (
                    <span className="ml-2 text-xs bg-black/20 px-2 py-0.5 rounded-md">
                      {playableSources.length} sources
                    </span>
                  )}
                </Button>
              ) : null}

              {showNoVideoState && (
                <SubmitVideoDialog defaultTitle={movie.title} defaultTmdbId={movie.id} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {showNoVideoState && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-10 text-center">
            <FilmIcon className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Video Available Yet</h3>
            <p className="text-neutral-500 text-sm mb-5 max-w-md mx-auto">
              We couldn&apos;t find this movie on Dailymotion or the Internet Archive.
              Submit a link or request it.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => navigate('/requests')} variant="outline">
                Request This Movie
              </Button>
              <SubmitVideoDialog defaultTitle={movie.title} defaultTmdbId={movie.id} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-12">
          <div className="md:col-span-1">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              />
            ) : null}
          </div>

          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-3 tracking-tight">Overview</h2>
            <p className="text-neutral-300 mb-6 leading-relaxed">{movie.overview}</p>

            <div className="mb-8 space-y-3">
              <DownloadButton
                tmdbId={movie.id}
                title={movie.title}
                posterUrl={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null}
              />
              <SubmitVideoDialog defaultTitle={movie.title} defaultTmdbId={movie.id} />
            </div>

            {youtubeTrailers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 tracking-tight">Trailers & Clips</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {youtubeTrailers.slice(0, 6).map((trailer: { id: string; key: string; name: string }) => (
                    <a
                      key={trailer.id}
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-36 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                        alt={trailer.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 glass-subtle backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs font-medium truncate">{trailer.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-neutral-600 mt-2">Opens on YouTube in a new tab</p>
              </div>
            )}

            {trailerSources.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 tracking-tight">Related Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trailerSources.slice(0, 3).map((source) => (
                    <button
                      key={source.id}
                      onClick={openPlayer}
                      className="group relative h-36 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
                    >
                      <img
                        src={source.thumbnail}
                        alt={source.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 glass-subtle backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs font-medium truncate">{source.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cast & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold mb-4 tracking-tight">Cast</h2>
            {cast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cast.slice(0, 12).map((person: CastMember) => (
                  <div key={person.id} className="text-center group">
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2 mx-auto bg-white/[0.05] ring-2 ring-white/[0.06] group-hover:ring-white/20 transition-all duration-300">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-neutral-600 text-xs">N/A</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate text-white/80">{person.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{person.character}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500">No cast information available.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 tracking-tight">Details</h2>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              {[
                { label: 'Status', value: movie.status },
                { label: 'Original Language', value: movie.original_language?.toUpperCase() },
                { label: 'Budget', value: movie.budget ? `$${movie.budget.toLocaleString()}` : 'N/A' },
                { label: 'Revenue', value: movie.revenue ? `$${movie.revenue.toLocaleString()}` : 'N/A' },
                { label: 'Production', value: movie.production_countries?.map((c: { name: string }) => c.name).join(', ') || 'N/A' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">{item.label}</span>
                  <span className="text-sm font-medium text-white/80">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6 tracking-tight">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {similarMovies.map((m: Movie) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  onClick={() => navigate(`/movie/${m.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player modal */}
      {isPlayerOpen && playableSources.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-5xl">
            <VideoPlayer
              sources={playableSources}
              title={movie.title}
              onClose={closePlayer}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
