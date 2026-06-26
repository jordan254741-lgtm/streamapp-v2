import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '@/hooks/useMovies';
import { useDebounce } from '@/hooks/useDebounce';
import { useMetaTags } from '@/hooks/useMeta';
import MovieCard from '@/components/movies/MovieCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import type { Genre } from '@/types';

const SKELETON_COUNT = 20;
const MAX_VISIBLE_PAGES = 5;
const SEARCH_DEBOUNCE_MS = 300;

const Browse: React.FC = () => {
  usePageMeta({ title: 'Browse', description: 'Browse and search movies from our collection.' });
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  const debouncedQuery = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const {
    movies,
    isLoading,
    error,
    totalPages,
    genres,
  } = useMovies({
    page: currentPage,
    query: debouncedQuery,
    genreId: selectedGenre,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenreClick = (genreId: number | null) => {
    setSelectedGenre((prev) => (prev === genreId ? null : genreId));
    setCurrentPage(1);
  };

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-lg font-semibold mb-2">Failed to load movies</p>
          <p className="text-gray-400 text-sm mb-4">{error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 p-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="w-full">
          <Skeleton className="aspect-[2/3] w-full rounded-lg mb-2" />
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  const renderGenreSkeletons = () => (
    <div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-900 rounded-lg">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );

  const renderGenreTabs = () => {
    if (isLoading && genres.length === 0) {
      return renderGenreSkeletons();
    }

    return (
      <div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-900 rounded-lg overflow-x-auto">
        <Button
          onClick={() => handleGenreClick(null)}
          variant={selectedGenre === null ? 'default' : 'outline'}
          className={
            selectedGenre === null
              ? 'bg-white text-black hover:bg-gray-200'
              : 'border-gray-700 text-white hover:bg-gray-800'
          }
        >
          All
        </Button>
        {genres.map((genre: Genre) => (
          <Button
            key={genre.id}
            onClick={() => handleGenreClick(genre.id)}
            variant={selectedGenre === genre.id ? 'default' : 'outline'}
            className={
              selectedGenre === genre.id
                ? 'bg-white text-black hover:bg-gray-200'
                : 'border-gray-700 text-white hover:bg-gray-800'
            }
          >
            {genre.name}
          </Button>
        ))}
      </div>
    );
  };

  const renderMovieGrid = () => {
    if (isLoading) {
      return renderSkeletonGrid();
    }

    if (movies.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">No movies found</p>
          <p className="text-gray-600 text-sm">
            {debouncedQuery
              ? `No results for "${debouncedQuery}". Try a different search term.`
              : 'Try adjusting your filters.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 p-4">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => handleMovieClick(movie.id)}
          />
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-1 mt-8 pb-8">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          variant="outline"
          className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-30"
        >
          ←
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            variant={currentPage === page ? 'default' : 'outline'}
            className={
              currentPage === page
                ? 'bg-white text-black hover:bg-gray-200'
                : 'border-gray-700 text-white hover:bg-gray-800'
            }
          >
            {page}
          </Button>
        ))}
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant="outline"
          className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-30"
        >
          →
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
          Browse Movies
        </h1>

        <div className="mb-6">
          <Label htmlFor="search" className="sr-only">
            Search Movies
          </Label>
          <Input
            id="search"
            type="search"
            placeholder="Search for movies..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-gray-500 focus-visible:ring-gray-700"
          />
        </div>

        {renderGenreTabs()}
        {renderMovieGrid()}
        {renderPagination()}
      </div>
    </div>
  );
};

export default Browse;
