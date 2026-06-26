import type { Movie, Genre, PaginatedResponse, Video, Credits } from '@/types';

export type { Movie, Genre, PaginatedResponse, Video, Credits };

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const MAX_429_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

interface TmdbError extends Error {
  status: number;
  retryAfter?: number;
}

const fetchFromTmdb = async <T>(
  endpoint: string,
  params?: Record<string, string>,
  retryCount: number = 0,
): Promise<T> => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());

  if (response.status === 429 && retryCount < MAX_429_RETRIES) {
    const delay = RETRY_DELAYS[retryCount];
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchFromTmdb<T>(endpoint, params, retryCount + 1);
  }

  if (!response.ok) {
    const error = new Error(`TMDB API error: ${response.status} ${response.statusText}`) as TmdbError;
    error.status = response.status;
    if (response.status === 429) {
      error.retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
    }
    throw error;
  }

  return response.json();
};

const CACHE_PREFIX = 'tmdb_cache_';
const CACHE_TTL = 1000 * 60 * 60 * 24;

const fetchWithCache = async <T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL,
): Promise<T> => {
  const cached = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached) as { data: T; timestamp: number };
    if (Date.now() - timestamp < ttl) {
      return data;
    }
    localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
  }

  const data = await fetchFn();
  localStorage.setItem(
    `${CACHE_PREFIX}${cacheKey}`,
    JSON.stringify({ data, timestamp: Date.now() }),
  );
  return data;
};

export const getPopularMovies = (page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTmdb('/movie/popular', { page: page.toString() });
};

export const searchMovies = (query: string, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTmdb('/search/movie', { query, page: page.toString() });
};

export const getMovieGenres = (): Promise<{ genres: Genre[] }> => {
  return fetchWithCache('genres', () => fetchFromTmdb('/genre/movie/list'));
};

export const discoverByGenre = (genreId: number, page: number = 1): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTmdb('/discover/movie', {
    with_genres: genreId.toString(),
    page: page.toString(),
  });
};

export const getMovieDetails = (id: number): Promise<Movie> => {
  return fetchFromTmdb(`/movie/${id}`);
};

export const getMovieVideos = (id: number): Promise<{ results: Video[] }> => {
  return fetchFromTmdb(`/movie/${id}/videos`);
};

export const getMovieCredits = (id: number): Promise<Credits> => {
  return fetchFromTmdb(`/movie/${id}/credits`);
};

export const getSimilarMovies = (id: number): Promise<PaginatedResponse<Movie>> => {
  return fetchFromTmdb(`/movie/${id}/similar`, { page: '1' });
};
