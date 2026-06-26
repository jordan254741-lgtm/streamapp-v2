import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useVideoSource } from '@/hooks/useVideoSource';
import { usePageMeta } from '@/hooks/usePageMeta';
import DownloadButton from '@/components/movies/DownloadButton';
import MovieCard from '@/components/movies/MovieCard';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlayIcon, XIcon } from 'lucide-react';
import type { Movie, Video, CastMember } from '@/types';

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
  const { videoSources, hasFullMovie } = useVideoSource({
    movieId,
    movieTitle: movie?.title ?? '',
    year: movie?.release_date ? parseInt(movie.release_date.split('-')[0]) : undefined,
  });
  const dmTrailerSources = videoSources.filter((s) => s.source === 'dailymotion' && !s.isFullMovie);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [playerSource, setPlayerSource] = useState<{
    type: 'youtube' | 'dailymotion';
    key?: string;
    url?: string;
    name: string;
  } | null>(null);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <p className="text-red-500">Error loading movie details: {error.message}</p>
      </div>
    );
  }

  const openVideoModal = (video: Video) => {
    setPlayerSource({ type: 'youtube', key: video.key, name: video.name });
    setIsVideoModalOpen(true);
  };

  const openDmVideo = (url: string, name: string) => {
    setPlayerSource({ type: 'dailymotion', url, name });
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setPlayerSource(null);
  };

  const getTrailers = () =>
    videos.filter((video: Video) => video.type === 'Trailer' || video.site === 'YouTube') || [];

  const otherVideos = videos.filter((video: Video) => !getTrailers().includes(video)) || [];

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
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
            <span>{movie.release_date?.split('-')[0]}</span>
            {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
            <span className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              {movie.vote_average?.toFixed(1)}
            </span>
          </div>
          {hasFullMovie && (
            <Button
              onClick={() => {
                const fullMovie = videoSources.find((s) => s.isFullMovie);
                if (fullMovie) {
                  openDmVideo(fullMovie.embedUrl, fullMovie.title);
                }
              }}
              className="mt-4 bg-white text-black hover:bg-gray-200 font-semibold"
              size="lg"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Watch Full Movie
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            )}
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

            {getTrailers().length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Trailers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getTrailers().slice(0, 3).map((trailer: Video) => (
                    <Button
                      key={trailer.id}
                      onClick={() => openVideoModal(trailer)}
                      className="group relative h-40 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
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
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {dmTrailerSources.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Dailymotion Trailers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dmTrailerSources.slice(0, 3).map((source) => (
                    <Button
                      key={source.id}
                      onClick={() => openDmVideo(source.embedUrl, source.title)}
                      className="group relative h-40 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
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
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {otherVideos.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Other Videos</h2>
                <div className="flex flex-wrap gap-2">
                  {otherVideos.slice(0, 5).map((video: Video) => (
                    <Button
                      key={video.id}
                      onClick={() => openVideoModal(video)}
                      variant="outline"
                      className="text-white border-gray-700 hover:bg-gray-800"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      {video.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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

        {similarMovies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarMovies.map((movie: Movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {isVideoModalOpen && playerSource && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              onClick={closeVideoModal}
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
      )}
    </div>
  );
};

export default MovieDetail;
