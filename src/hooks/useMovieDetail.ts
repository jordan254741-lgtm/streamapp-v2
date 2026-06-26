import { useQuery } from '@tanstack/react-query';
import { getMovieDetails, getMovieVideos, getMovieCredits, getSimilarMovies } from '@/lib/tmdb';
import type { Movie, Video, Credits, PaginatedResponse } from '@/types';

interface UseMovieDetailOptions {
  id: number;
}

export interface MovieDetailData {
  movie: Movie | undefined;
  videos: Video[];
  cast: Credits['cast'];
  similarMovies: Movie[];
  isLoading: boolean;
  error: Error | null;
}

export const useMovieDetail = ({ id }: UseMovieDetailOptions): MovieDetailData => {
  const { data: movie, isLoading: isLoadingMovie, error: movieError } = useQuery<Movie, Error>({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
    enabled: id > 0,
  });

  const { data: videos, isLoading: isLoadingVideos, error: videosError } = useQuery<{ results: Video[] }, Error>({
    queryKey: ['movieVideos', id],
    queryFn: () => getMovieVideos(id),
    enabled: id > 0,
  });

  const { data: credits, isLoading: isLoadingCredits, error: creditsError } = useQuery<Credits, Error>({
    queryKey: ['movieCredits', id],
    queryFn: () => getMovieCredits(id),
    enabled: id > 0,
  });

  const { data: similar, isLoading: isLoadingSimilar, error: similarError } = useQuery<PaginatedResponse<Movie>, Error>({
    queryKey: ['movieSimilar', id],
    queryFn: () => getSimilarMovies(id),
    enabled: id > 0,
  });

  return {
    movie,
    videos: videos?.results ?? [],
    cast: credits?.cast ?? [],
    similarMovies: similar?.results ?? [],
    isLoading: isLoadingMovie || isLoadingVideos || isLoadingCredits || isLoadingSimilar,
    error: movieError || videosError || creditsError || similarError,
  };
};
