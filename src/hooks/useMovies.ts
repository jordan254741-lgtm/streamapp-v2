import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getPopularMovies, searchMovies, getMovieGenres, discoverByGenre } from '@/lib/tmdb';
import type { Movie, Genre, PaginatedResponse } from '@/types';

interface UseMoviesOptions {
  page?: number;
  query?: string;
  genreId?: number | null;
}

export interface UseMoviesReturn {
  movies: Movie[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  totalPages: number;
  currentPage: number;
  genres: Genre[];
}

export const useMovies = ({ page = 1, query = '', genreId = null }: UseMoviesOptions): UseMoviesReturn => {
  const isSearching = query.length > 0;
  const hasGenre = genreId !== null;

  const queryKey = isSearching
    ? ['movies', 'search', query, page]
    : hasGenre
      ? ['movies', 'genre', genreId, page]
      : ['movies', 'popular', page];

  const queryFn = (): Promise<PaginatedResponse<Movie>> => {
    if (isSearching) {
      return searchMovies(query, page);
    }
    if (hasGenre) {
      return discoverByGenre(genreId, page);
    }
    return getPopularMovies(page);
  };

  const { data: moviesData, isLoading: isLoadingMovies, error: moviesError, isFetching } = useQuery<PaginatedResponse<Movie>, Error>({
    queryKey,
    queryFn,
    placeholderData: keepPreviousData,
  });

  const { data: genresData, isLoading: isLoadingGenres, error: genresError } = useQuery<{ genres: Genre[] }, Error>({
    queryKey: ['genres'],
    queryFn: getMovieGenres,
    staleTime: Infinity,
  });

  const movies = moviesData?.results ?? [];

  return {
    movies,
    isLoading: (isLoadingMovies || isLoadingGenres) && !isFetching,
    isFetching,
    error: moviesError || genresError,
    totalPages: moviesData?.total_pages ?? 0,
    currentPage: moviesData?.page ?? 1,
    genres: genresData?.genres ?? [],
  };
};
