interface DailymotionVideo {
  id: string;
  title: string;
  duration: number;
  views_total: number;
  url: string;
  embed_url: string;
  thumbnail_720_url: string;
  owner: { username: string; url: string };
  created_time: number;
  tags: string[];
  description: string;
}

interface DailymotionResponse<T> {
  list: T[];
  has_more: boolean;
  page: number;
  limit: number;
  total: number;
}

interface SearchOptions {
  query: string;
  limit?: number;
  page?: number;
  duration_min?: number;
  duration_max?: number;
  sort?: string;
}

const BASE_URL = 'https://api.dailymotion.com';

const fetchFromDailymotion = async <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Dailymotion API error: ${response.status}`);
  }
  return response.json();
};

const searchDailymotion = async (options: SearchOptions): Promise<DailymotionResponse<DailymotionVideo>> => {
  const { query, limit = 20, page = 1, duration_min, duration_max, sort } = options;

  const params: Record<string, string> = {
    search: query,
    limit: limit.toString(),
    page: page.toString(),
    fields: 'id,title,duration,views_total,url,embed_url,thumbnail_720_url,owner,created_time,tags,description',
  };

  if (duration_min) params.duration_min = duration_min.toString();
  if (duration_max) params.duration_max = duration_max.toString();
  if (sort) params.sort = sort;

  return fetchFromDailymotion<DailymotionResponse<DailymotionVideo>>('/videos', params);
};

const buildAllQueries = (movieTitle: string, year?: number): string[] => {
  const clean = movieTitle.replace(/[^\w\s]/g, '').trim();
  const queries: string[] = [];
  const yearStr = year?.toString();

  // High-priority: title + year + movie context
  if (yearStr) queries.push(`${clean} ${yearStr}`);
  if (yearStr) queries.push(`"${clean}" ${yearStr} movie`);
  if (yearStr) queries.push(`"${clean}" ${yearStr}`);

  // Title + movie/film keywords
  queries.push(`${clean} full movie`);
  queries.push(`${clean} movie`);
  queries.push(`${clean} film`);
  queries.push(`${clean} 1080p`);
  queries.push(`"${clean}" full movie`);

  // Title + year + movie keywords
  if (yearStr) queries.push(`${clean} ${yearStr} full movie`);
  if (yearStr) queries.push(`${clean} ${yearStr} film`);

  // Just the title (broadest)
  queries.push(clean);

  // With year appended (different position)
  if (yearStr) queries.push(`${yearStr} ${clean}`);

  return [...new Set(queries)];
};

const deduplicate = (videos: DailymotionVideo[]): DailymotionVideo[] => {
  const seen = new Set<string>();
  return videos.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
};

const MIN_FULL_MOVIE_DURATION = 45 * 60;
const MAX_FULL_MOVIE_DURATION = 4 * 60 * 60;

export const searchFullMovie = async (movieTitle: string, year?: number): Promise<DailymotionVideo | null> => {
  const queries = buildAllQueries(movieTitle, year);
  const allResults: DailymotionVideo[] = [];

  for (const query of queries) {
    try {
      const response = await searchDailymotion({
        query,
        limit: 10,
        sort: 'relevance',
      });

      const movies = response.list.filter(
        (v) => v.duration >= MIN_FULL_MOVIE_DURATION && v.duration <= MAX_FULL_MOVIE_DURATION
      );

      if (movies.length > 0) {
        allResults.push(...movies);
      }

      if (allResults.length >= 10) break;
    } catch {
      continue;
    }
  }

  const deduped = deduplicate(allResults);
  deduped.sort((a, b) => b.views_total - a.views_total);

  return deduped.length > 0 ? deduped[0] : null;
};

export const searchAllDailymotion = async (movieTitle: string, year?: number): Promise<DailymotionVideo[]> => {
  const queries = buildAllQueries(movieTitle, year);
  const allResults: DailymotionVideo[] = [];

  for (const query of queries) {
    try {
      const response = await searchDailymotion({
        query,
        limit: 10,
        sort: 'relevance',
      });

      if (response.list.length > 0) {
        allResults.push(...response.list);
      }

      if (allResults.length >= 20) break;
    } catch {
      continue;
    }
  }

  const deduped = deduplicate(allResults);
  deduped.sort((a, b) => b.views_total - a.views_total);

  return deduped;
};

export const searchTrailers = async (movieTitle: string, year?: number): Promise<DailymotionVideo[]> => {
  const clean = movieTitle.replace(/[^\w\s]/g, '').trim();
  const queries = [
    `${clean} trailer`,
    `${clean} official trailer`,
    `${clean} movie trailer`,
    year ? `${clean} ${year} trailer` : '',
    year ? `${clean} ${year} official trailer` : '',
    `"${clean}" trailer`,
  ].filter(Boolean);

  const allTrailers: DailymotionVideo[] = [];

  for (const query of queries) {
    try {
      const response = await searchDailymotion({
        query,
        limit: 5,
        duration_max: 15 * 60,
        sort: 'relevance',
      });

      allTrailers.push(...response.list.filter((v) => v.duration <= 15 * 60));
    } catch {
      continue;
    }
  }

  return deduplicate(allTrailers).slice(0, 10);
};

export const getVideoDetails = async (videoId: string): Promise<DailymotionVideo> => {
  return fetchFromDailymotion<DailymotionVideo>(`/video/${videoId}`, {
    fields: 'id,title,duration,views_total,url,embed_url,thumbnail_720_url,owner,created_time,tags,description',
  });
};

export type { DailymotionVideo, DailymotionResponse, SearchOptions };
