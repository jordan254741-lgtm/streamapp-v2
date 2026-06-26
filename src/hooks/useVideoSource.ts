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

export type VideoStatus = 'loading' | 'available' | 'not-found' | 'error';

interface UseVideoSourceOptions {
  movieId: number;
  movieTitle: string;
  year?: number;
}

interface UseVideoSourceReturn {
  videoSources: VideoSource[];
  isLoading: boolean;
  error: Error | null;
  hasFullMovie: boolean;
  hasYouTubeTrailers: boolean;
  status: VideoStatus;
  dmFullMovie: VideoSource | null;
  dmTrailerSources: VideoSource[];
  youtubeTrailerSources: VideoSource[];
}

export const useVideoSource = ({ movieId, movieTitle, year }: UseVideoSourceOptions): UseVideoSourceReturn => {
  const hasTitle = movieTitle.trim().length > 0;

  const dmFullMovieQuery = useQuery({
    queryKey: ['dailymotion', 'fullmovie', movieId],
    queryFn: () => searchFullMovie(movieTitle, year),
    enabled: movieId > 0 && hasTitle,
    staleTime: 1000 * 60 * 60,
  });

  const dmTrailersQuery = useQuery({
    queryKey: ['dailymotion', 'trailers', movieId],
    queryFn: () => searchTrailers(movieTitle, year),
    enabled: movieId > 0 && hasTitle,
    staleTime: 1000 * 60 * 60,
  });

  const youtubeVideosQuery = useQuery({
    queryKey: ['youtube', 'videos', movieId],
    queryFn: async () => {
      const response = await getMovieVideos(movieId);
      return response.results.filter((v) => v.site === 'YouTube');
    },
    enabled: movieId > 0 && hasTitle && !dmFullMovieQuery.data && dmTrailersQuery.data?.length === 0,
    staleTime: 1000 * 60 * 60,
  });

  const videoSources: VideoSource[] = [];
  let dmFullMovie: VideoSource | null = null;
  const dmTrailerSources: VideoSource[] = [];
  const youtubeTrailerSources: VideoSource[] = [];

  if (dmFullMovieQuery.data) {
    dmFullMovie = {
      id: dmFullMovieQuery.data.id,
      title: `${dmFullMovieQuery.data.title} (Full Movie)`,
      source: 'dailymotion',
      embedUrl: dmFullMovieQuery.data.embed_url,
      thumbnail: dmFullMovieQuery.data.thumbnail_720_url,
      duration: dmFullMovieQuery.data.duration,
      isFullMovie: true,
      views: dmFullMovieQuery.data.views_total,
    };
    videoSources.push(dmFullMovie);
  }

  if (dmTrailersQuery.data?.length) {
    dmTrailersQuery.data.forEach((video) => {
      const source: VideoSource = {
        id: video.id,
        title: video.title,
        source: 'dailymotion',
        embedUrl: video.embed_url,
        thumbnail: video.thumbnail_720_url,
        duration: video.duration,
        isFullMovie: false,
        views: video.views_total,
      };
      dmTrailerSources.push(source);
      videoSources.push(source);
    });
  }

  if (youtubeVideosQuery.data?.length) {
    youtubeVideosQuery.data.forEach((video) => {
      const source: VideoSource = {
        id: `yt-${video.id}`,
        title: video.name,
        source: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`,
        thumbnail: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`,
        duration: 0,
        isFullMovie: false,
        views: 0,
      };
      youtubeTrailerSources.push(source);
      videoSources.push(source);
    });
  }

  const isLoading = dmFullMovieQuery.isLoading || dmTrailersQuery.isLoading || youtubeVideosQuery.isLoading;
  const error = dmFullMovieQuery.error || dmTrailersQuery.error || youtubeVideosQuery.error;

  let status: VideoStatus = 'loading';
  if (!isLoading) {
    if (videoSources.length > 0) {
      status = 'available';
    } else if (error) {
      status = 'error';
    } else {
      status = 'not-found';
    }
  } else if (error) {
    status = 'error';
  }

  return {
    videoSources,
    isLoading,
    error,
    hasFullMovie: dmFullMovie !== null,
    hasYouTubeTrailers: youtubeTrailerSources.length > 0,
    status,
    dmFullMovie,
    dmTrailerSources,
    youtubeTrailerSources,
  };
};