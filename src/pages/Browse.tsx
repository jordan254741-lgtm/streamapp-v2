import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '@/hooks/useMovies';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useCommunityVideos } from '@/hooks/useCommunityVideos';
import MovieCard from '@/components/movies/MovieCard';
import CommunityVideoCard from '@/components/community/CommunityVideoCard';
import SubmitVideoDialog from '@/components/community/SubmitVideoDialog';
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

  const {
    data: communityVideos,
    isLoading: communityLoading,
  } = useCommunityVideos();

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-2">Failed to load movies</p>
          <p className="text-neutral-400 text-sm mb-4">{error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="w-full">
          <Skeleton className="aspect-[2/3] w-full rounded-xl mb-2.5" />
          <Skeleton className="h-4 w-3/4 mb-1.5 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );

  const renderGenreSkeletons = () => (
    <div className="flex flex-wrap gap-2 mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
  );

  const renderGenreTabs = () => {
    if (isLoading && genres.length === 0) {
      return renderGenreSkeletons();
    }

    return (
      <div className="flex flex-wrap gap-2 mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
        <Button
          onClick={() => handleGenreClick(null)}
          variant={selectedGenre === null ? 'default' : 'ghost'}
          size="sm"
          className={
            selectedGenre === null
              ? 'bg-white text-black hover:bg-white/90'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }
        >
          All
        </Button>
        {genres.map((genre: Genre) => (
          <Button
            key={genre.id}
            onClick={() => handleGenreClick(genre.id)}
            variant={selectedGenre === genre.id ? 'default' : 'ghost'}
            size="sm"
            className={
              selectedGenre === genre.id
                ? 'bg-white text-black hover:bg-white/90'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
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
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <p className="text-neutral-300 text-lg font-medium mb-1">No movies found</p>
          <p className="text-neutral-500 text-sm">
            {debouncedQuery
              ? `No results for "${debouncedQuery}". Try a different search term.`
              : 'Try adjusting your filters.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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
      <div className="flex justify-center items-center gap-1.5 mt-10 pb-10">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-white disabled:opacity-20"
        >
          ←
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            variant={currentPage === page ? 'default' : 'ghost'}
            size="sm"
            className={
              currentPage === page
                ? 'bg-white text-black hover:bg-white/90 min-w-[36px]'
                : 'text-neutral-400 hover:text-white hover:bg-white/10 min-w-[36px]'
            }
          >
            {page}
          </Button>
        ))}
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-white disabled:opacity-20"
        >
          →
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
            Browse
          </h1>
          <p className="text-neutral-500 text-sm">Discover movies and TV shows</p>
        </div>

        <div className="mb-6">
          <Label htmlFor="search" className="sr-only">
            Search Movies
          </Label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <Input
              id="search"
              type="search"
              placeholder="Search movies..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-neutral-600 focus-visible:border-white/20 focus-visible:bg-white/[0.06] h-12 rounded-xl"
            />
          </div>
        </div>

        {renderGenreTabs()}
        {renderMovieGrid()}
        {renderPagination()}

        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Community Videos</h2>
              <p className="text-neutral-500 text-sm mt-1">Submitted by the community</p>
            </div>
            <SubmitVideoDialog />
          </div>

          {communityLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full">
                  <Skeleton className="aspect-[2/3] w-full rounded-xl mb-2.5" />
                  <Skeleton className="h-4 w-3/4 mb-1.5 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : communityVideos && communityVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {communityVideos.slice(0, 12).map((video) => (
                <CommunityVideoCard
                  key={video.id}
                  video={video}
                  onClick={() => navigate(`/watch/${video.id}`)}
                />
              ))}
            </div>
          ) : (
            !communityLoading && (
              <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <p className="text-neutral-300 font-medium mb-1">No community videos yet</p>
                <p className="text-neutral-500 text-sm mb-4">Be the first to submit a video link!</p>
                <SubmitVideoDialog />
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
};

export default Browse;
