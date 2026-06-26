import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  isLoading?: boolean;
  onClick?: () => void;
}

const MovieCardSkeleton: React.FC = () => (
  <div className="w-full group cursor-pointer">
    <Skeleton className="aspect-[2/3] w-full rounded-xl mb-2.5" />
    <Skeleton className="h-4 w-3/4 mb-1.5 rounded-md" />
    <Skeleton className="h-3 w-1/2 rounded-md" />
  </div>
);

const MovieCard: React.FC<MovieCardProps> = ({ movie, isLoading, onClick }) => {
  if (isLoading) {
    return <MovieCardSkeleton />;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750/111/333?text=No+Image';

  const year = movie.release_date?.split('-')[0] ?? 'N/A';
  const rating = movie.vote_average?.toFixed(1) ?? 'N/A';

  return (
    <Card
      className="w-full bg-transparent border-0 text-white overflow-hidden shadow-none hover:shadow-none cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-xl">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-xs text-neutral-300 line-clamp-2">{movie.overview?.slice(0, 80)}...</p>
        </div>
        <div className="absolute top-2.5 right-2.5 bg-black/60 glass-subtle backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
          <span className="text-amber-400 text-[10px]">★</span>
          {rating}
        </div>
        {movie.vote_average && movie.vote_average >= 7.5 && (
          <div className="absolute top-2.5 left-2.5 bg-white/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            Popular
          </div>
        )}
      </div>
      <CardContent className="p-2 px-0">
        <h3 className="text-sm font-semibold truncate text-white/90 group-hover:text-white transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">{year}</p>
      </CardContent>
    </Card>
  );
};

export default MovieCard;
