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
  <Card className="w-full bg-gray-900 border-gray-700 overflow-hidden">
    <Skeleton className="aspect-[2/3] w-full rounded-none" />
    <CardContent className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardContent>
  </Card>
);

const MovieCard: React.FC<MovieCardProps> = ({ movie, isLoading, onClick }) => {
  if (isLoading) {
    return <MovieCardSkeleton />;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  const year = movie.release_date?.split('-')[0] ?? 'N/A';

  return (
    <Card
      className="w-full bg-gray-900 border-gray-700 text-white overflow-hidden shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <span className="text-yellow-500">★</span>
          {movie.vote_average?.toFixed(1) ?? 'N/A'}
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="text-sm font-semibold truncate mb-0.5">{movie.title}</h3>
        <p className="text-xs text-gray-400">{year}</p>
      </CardContent>
    </Card>
  );
};

export default MovieCard;
