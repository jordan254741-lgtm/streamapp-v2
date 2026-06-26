import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useVideoSource } from '@/hooks/useVideoSource';
import { usePageMeta } from '@/hooks/usePageMeta';
import DownloadButton from '@/components/movies/DownloadButton';
import MovieCard from '@/components/movies/MovieCard';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlayIcon, XIcon, FilmIcon } from 'lucide-react';
import type { Movie, Video as TmdbVideo, CastMember } from '@/types';
import type { VideoStatus } from '@/hooks/useVideoSource';

type PlayerSource =
  | { type: 'youtube'; key: string; name: string }
  | { type: 'dailymotion'; url: string; name: string };

const StatusBadge = ({ status }: { status: VideoStatus }) => {
  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        Searching...
      </span>
    );
  }
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Available
      </span>
    );
  }
  if (status === 'not-found') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Not Found
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
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
    url: movie?.id ? `https://streamapp.example.com/movie/${movie.id}` : undefined,
    type: 'article',
  });

  const { status, isLoading: isVideoLoading, dmFullMovie, dmTrailerSources, youtubeTrailerSources } = useVideoSource({
    movieId,
    movieTitle: movie?.title ?? '',
    year: movie?.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerSource, setPlayerSource] = useState<PlayerSource | null>(null);

  const openPlayer = useCallback((source: PlayerSource) => {
    setPlayerSource(source);
    setIsModalOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsModalOpen(false);
    setPlayerSource(null);
  }, []);

  const handlePlay = useCallback(() => {
    if (dmFullMovie) {
      openPlayer({ type: 'dailymotion', url: dmFullMovie.embedUrl, name: dmFullMovie.title });
    } else if (dmTrailerSources.length > 0) {
      openPlayer({ type: 'dailymotion', url: dmTrailerSources[0].embedUrl, name: dmTrailerSources[0].title });
    } else if (youtubeTrailerSources.length > 0) {
      openPlayer({ type: 'youtube', key: youtubeTrailerSources[0].id.replace('yt-', ''), name: youtubeTrailerSources[0].title });
    }
  }, [dmFullMovie, dmTrailerSources, youtubeTrailerSources, openPlayer]);

  const handleWatchTrailer = useCallback(() => {
    const ytTrailer = videos.find((v: TmdbVideo) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    if (ytTrailer) {
      openPlayer({ type: 'youtube', key: ytTrailer.key, name: ytTrailer.name });
    }
  }, [videos, openPlayer]);

  const playLabel = dmFullMovie ? 'Watch Full Movie' : dmTrailerSources.length > 0 ? 'Watch Trailer' : 'Play';

  const getYouTubeTrailers = () =>
    videos.filter((v: TmdbVideo) => v.site === 'YouTube') || [];

  const getFeaturedTrailer = () =>
    videos.find((v: TmdbVideo) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderSkeleton = () => (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <Skeleton className="h-12 w-48 mb-8" />
      <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-8">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-8" />
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <p className="text-red-500">Error loading movie details: {error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return renderSkeleton();
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <p className="text-gray-400">Movie not found.</p>
      </div>
    );
  }

  const showNoVideoState = !isVideoLoading && status === 'not-found';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative h-[50vh] md:h-[70vh] w-full">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w1280${movie.poster_path}`}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-300 mb-4">
            <span>{movie.release_date?.split('-')[0]}</span>
            {movie.runtime ? <span>{formatRuntime(movie.runtime)}</span> : null}
            {movie.vote_average ? (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                {movie.vote_average.toFixed(1)}
              </span>
            ) : null}
          </div>
          <StatusBadge status={status} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
            <Button
              onClick={handlePlay}
              disabled={isVideoLoading || status === 'not-found'}
              className="min-h-[44px] w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-semibold px-6"
              size="lg"
            >
              {isVideoLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2 shrink-0" />
                  {playLabel}
                </>
              )}
            </Button>
            {getFeaturedTrailer() ? (
              <Button
                onClick={handleWatchTrailer}
                variant="outline"
                className="min-h-[44px] w-full sm:w-auto border-gray-600 text-white hover:bg-gray-800 px-6"
                size="lg"
              >
                <PlayIcon className="w-5 h-5 mr-2 shrink-0" />
                Watch Trailer
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {showNoVideoState ? (
          <div className="bg-gray-900 rounded-lg p-6 md:p-8 mb-8 text-center">
            <FilmIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Video Available</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
              We couldn&apos;t find this movie on our sources. Request it and we&apos;ll add it as soon as possible.
            </p>
            <Button
              onClick={() => navigate('/requests')}
              className="bg-white text-black hover:bg-gray-200 font-medium"
            >
              Request This Movie
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            ) : null}
          </div>

          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-gray-300 mb-4 leading-relaxed">{movie.overview}</p>

            <div className="mb-6">
              <DownloadButton
                tmdbId={movie.id}
                title={movie.title}
                posterUrl={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null}
              />
            </div>

            {getYouTubeTrailers().length > 0 ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Trailers & Clips</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getYouTubeTrailers().slice(0, 6).map((trailer: TmdbVideo) => (
                    <button
                      key={trailer.id}
                      onClick={() => openPlayer({ type: 'youtube', key: trailer.key, name: trailer.name })}
                      className="group relative h-40 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200 bg-gray-900"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                        alt={trailer.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center">
                        <PlayIcon className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm truncate">{trailer.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {dmTrailerSources.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">More Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dmTrailerSources.slice(0, 3).map((source) => (
                    <button
                      key={source.id}
                      onClick={() => openPlayer({ type: 'dailymotion', url: source.embedUrl, name: source.title })}
                      className="group relative h-40 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200 bg-gray-900"
                    >
                      <img
                        src={source.thumbnail}
                        alt={source.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center">
                        <PlayIcon className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm truncate">{source.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Cast</h2>
            {cast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cast.slice(0, 12).map((person: CastMember) => (
                  <div key={person.id} className="text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-2 mx-auto bg-gray-800">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    <p className="text-xs text-gray-400 truncate">{person.character}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No cast information available.</p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Details</h2>
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span>{movie.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Original Language:</span>
                <span>{movie.original_language?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Budget:</span>
                <span>${movie.budget?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Revenue:</span>
                <span>${movie.revenue?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Production:</span>
                <span>{movie.production_countries?.map((c: { name: string }) => c.name).join(', ') || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {similarMovies.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarMovies.map((m: Movie) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  onClick={() => navigate(`/movie/${m.id}`)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {isModalOpen && playerSource ? (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              onClick={closePlayer}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-transparent hover:bg-transparent"
              variant="ghost"
            >
              <XIcon className="w-6 h-6" />
            </Button>
            {playerSource.type === 'youtube' ? (
              <VideoPlayer
                youtubeKey={playerSource.key}
                title={playerSource.name}
                className="rounded-lg overflow-hidden"
              />
            ) : (
              <VideoPlayer
                dailymotionUrl={playerSource.url}
                title={playerSource.name}
                className="rounded-lg overflow-hidden"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MovieDetail;