import { useQuery } from '@tanstack/react-query';
import { searchFullMovie, searchTrailers } from '@/lib/dailymotion';
import { getMovieVideos } from '@/lib/tmdb';

export interface VideoSource {
  id: string;
  title: string;
  source: 'dailymotion' | 'youtube';
  embedUrl: string;
  thumbnail: string;
  duration: number;
  isFullMovie: boolean;
  views: number;
}

interface UseVideoSourceOptions {
  movieId: number;
  movieTitle: string;
  year?: number;
}

export const useVideoSource = ({ movieId, movieTitle, year }: UseVideoSourceOptions) => {
  const hasTitle = movieTitle.trim().length > 0;

  const dmFullMovie = useQuery({
    queryKey: ['dailymotion', 'fullmovie', movieId],
    queryFn: () => searchFullMovie(movieTitle, year),
    enabled: movieId > 0 && hasTitle,
    staleTime: 1000 * 60 * 60,
  });

  const dmTrailers = useQuery({
    queryKey: ['dailymotion', 'trailers', movieId],
    queryFn: () => searchTrailers(movieTitle, year),
    enabled: movieId > 0 && hasTitle,
    staleTime: 1000 * 60 * 60,
  });

  const youtubeVideos = useQuery({
    queryKey: ['youtube', 'videos', movieId],
    queryFn: async () => {
      const response = await getMovieVideos(movieId);
      return response.results.filter((v) => v.site === 'YouTube');
    },
    enabled: movieId > 0 && hasTitle && !dmFullMovie.data && dmTrailers.data?.length === 0,
    staleTime: 1000 * 60 * 60,
  });

  const videoSources: VideoSource[] = [];

  if (dmFullMovie.data) {
    videoSources.push({
      id: dmFullMovie.data.id,
      title: `${dmFullMovie.data.title} (Full Movie)`,
      source: 'dailymotion',
      embedUrl: dmFullMovie.data.embed_url,
      thumbnail: dmFullMovie.data.thumbnail_720_url,
      duration: dmFullMovie.data.duration,
      isFullMovie: true,
      views: dmFullMovie.data.views_total,
    });
  }

  if (dmTrailers.data?.length) {
    dmTrailers.data.forEach((video) => {
      videoSources.push({
        id: video.id,
        title: video.title,
        source: 'dailymotion',
        embedUrl: video.embed_url,
        thumbnail: video.thumbnail_720_url,
        duration: video.duration,
        isFullMovie: false,
        views: video.views_total,
      });
    });
  }

  if (youtubeVideos.data?.length) {
    youtubeVideos.data.forEach((video) => {
      videoSources.push({
        id: `yt-${video.id}`,
        title: video.name,
        source: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`,
        thumbnail: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`,
        duration: 0,
        isFullMovie: false,
        views: 0,
      });
    });
  }

  return {
    videoSources,
    isLoading: dmFullMovie.isLoading || dmTrailers.isLoading || youtubeVideos.isLoading,
    error: dmFullMovie.error || dmTrailers.error || youtubeVideos.error,
    hasFullMovie: !!dmFullMovie.data,
  };
};
