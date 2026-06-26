import { useQuery } from '@tanstack/react-query';
import { searchFullMovie, searchAllDailymotion, searchTrailers } from '@/lib/dailymotion';
import { searchInternetArchive } from '@/lib/internetarchive';
import { getMovieVideos } from '@/lib/tmdb';

export type VideoSourceType = 'dailymotion' | 'archive' | 'youtube';

export interface VideoSource {
  id: string;
  title: string;
  source: VideoSourceType;
  embedUrl: string;
  thumbnail: string;
  duration: number;
  isFullMovie: boolean;
  views: number;
}

export interface TrailerSource {
  id: string;
  title: string;
  source: 'dailymotion' | 'youtube';
  embedUrl: string;
  thumbnail: string;
  duration: number;
}

export type VideoStatus = 'loading' | 'available' | 'not-found' | 'error';

export type SearchStage = 'dailymotion' | 'archive' | 'complete';

interface UseVideoSourceOptions {
  movieId: number;
  movieTitle: string;
  year?: number;
}

interface UseVideoSourceReturn {
  playableSources: VideoSource[];
  isLoading: boolean;
  error: Error | null;
  hasFullMovie: boolean;
  status: VideoStatus;
  searchStage: SearchStage;
  primarySource: VideoSource | null;
  trailerSources: TrailerSource[];
}

const MIN_FULL_MOVIE = 45 * 60;
const MAX_FULL_MOVIE = 4 * 60 * 60;

const isFullMovie = (duration: number) => duration >= MIN_FULL_MOVIE && duration <= MAX_FULL_MOVIE;

export const useVideoSource = ({ movieId, movieTitle, year }: UseVideoSourceOptions): UseVideoSourceReturn => {
  const hasTitle = movieTitle.trim().length > 0;

  const dmFullMovieQuery = useQuery({
    queryKey: ['dailymotion', 'fullmovie', movieId],
    queryFn: () => searchFullMovie(movieTitle, year),
    enabled: movieId > 0 && hasTitle,
    staleTime: 1000 * 60 * 60,
  });

  const dmAllQuery = useQuery({
    queryKey: ['dailymotion', 'all', movieId],
    queryFn: () => searchAllDailymotion(movieTitle, year),
    enabled: movieId > 0 && hasTitle && !dmFullMovieQuery.data,
    staleTime: 1000 * 60 * 60,
  });

  const dmTrailersQuery = useQuery({
    queryKey: ['dailymotion', 'trailers', movieId],
    queryFn: () => searchTrailers(movieTitle, year),
    enabled: movieId > 0 && hasTitle,
    staleTime: 1000 * 60 * 60,
  });

  const archiveQuery = useQuery({
    queryKey: ['archive', 'movie', movieId],
    queryFn: () => searchInternetArchive(movieTitle, year),
    enabled: movieId > 0 && hasTitle && !dmFullMovieQuery.data,
    staleTime: 1000 * 60 * 60,
  });

  const hasDmContent = !!dmFullMovieQuery.data || (dmAllQuery.data?.length ?? 0) > 0;
  const hasArchiveContent = (archiveQuery.data?.length ?? 0) > 0;

  const youtubeQuery = useQuery({
    queryKey: ['youtube', 'videos', movieId],
    queryFn: async () => {
      const response = await getMovieVideos(movieId);
      return response.results
        .filter((v: { site: string }) => v.site === 'YouTube')
        .slice(0, 3);
    },
    enabled: movieId > 0 && hasTitle && !hasDmContent && !hasArchiveContent,
    staleTime: 1000 * 60 * 60,
  });

  const playableSources: VideoSource[] = [];

  if (dmFullMovieQuery.data) {
    playableSources.push({
      id: dmFullMovieQuery.data.id,
      title: dmFullMovieQuery.data.title,
      source: 'dailymotion',
      embedUrl: dmFullMovieQuery.data.embed_url,
      thumbnail: dmFullMovieQuery.data.thumbnail_720_url,
      duration: dmFullMovieQuery.data.duration,
      isFullMovie: true,
      views: dmFullMovieQuery.data.views_total,
    });
  }

  if (!dmFullMovieQuery.data && dmAllQuery.data?.length) {
    const fullMovies = dmAllQuery.data.filter((v) => isFullMovie(v.duration));
    const clips = dmAllQuery.data.filter((v) => !isFullMovie(v.duration));

    for (const video of [...fullMovies, ...clips].slice(0, 5)) {
      if (!playableSources.some((s) => s.id === video.id)) {
        playableSources.push({
          id: video.id,
          title: isFullMovie(video.duration) ? `${video.title} (Full Movie)` : video.title,
          source: 'dailymotion',
          embedUrl: video.embed_url,
          thumbnail: video.thumbnail_720_url,
          duration: video.duration,
          isFullMovie: isFullMovie(video.duration),
          views: video.views_total,
        });
      }
    }
  }

  if (archiveQuery.data?.length) {
    for (const video of archiveQuery.data.slice(0, 3)) {
      playableSources.push({
        id: video.id,
        title: video.title,
        source: 'archive',
        embedUrl: video.embedUrl,
        thumbnail: video.thumbnail,
        duration: video.duration,
        isFullMovie: video.duration >= MIN_FULL_MOVIE,
        views: video.views,
      });
    }
  }

  if (youtubeQuery.data?.length && playableSources.length === 0) {
    for (const video of youtubeQuery.data) {
      playableSources.push({
        id: `yt-${video.id}`,
        title: video.name,
        source: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0&modestbranding=1`,
        thumbnail: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`,
        duration: 0,
        isFullMovie: false,
        views: 0,
      });
    }
  }

  const trailerSources: TrailerSource[] = [];

  if (dmTrailersQuery.data?.length) {
    for (const video of dmTrailersQuery.data.slice(0, 6)) {
      trailerSources.push({
        id: video.id,
        title: video.title,
        source: 'dailymotion',
        embedUrl: video.embed_url,
        thumbnail: video.thumbnail_720_url,
        duration: video.duration,
      });
    }
  }

  const isLoading =
    dmFullMovieQuery.isLoading ||
    (dmAllQuery.isLoading && !dmFullMovieQuery.data) ||
    dmTrailersQuery.isLoading ||
    (archiveQuery.isLoading && !dmFullMovieQuery.data);

  const error = dmFullMovieQuery.error || dmAllQuery.error || dmTrailersQuery.error || archiveQuery.error;

  const allQueriesDone = !dmFullMovieQuery.isLoading &&
    !dmAllQuery.isLoading &&
    !dmTrailersQuery.isLoading &&
    !archiveQuery.isLoading &&
    !youtubeQuery.isLoading;

  let status: VideoStatus = 'loading';
  if (allQueriesDone) {
    if (playableSources.length > 0) {
      status = 'available';
    } else if (error) {
      status = 'error';
    } else {
      status = 'not-found';
    }
  }

  let searchStage: SearchStage = 'dailymotion';
  if (allQueriesDone) {
    searchStage = 'complete';
  } else if (!dmFullMovieQuery.isLoading && !dmAllQuery.isLoading && archiveQuery.isLoading) {
    searchStage = 'archive';
  }

  const primarySource = playableSources.length > 0 ? playableSources[0] : null;

  return {
    playableSources,
    isLoading,
    error,
    hasFullMovie: primarySource?.isFullMovie ?? false,
    status,
    searchStage,
    primarySource,
    trailerSources,
  };
};