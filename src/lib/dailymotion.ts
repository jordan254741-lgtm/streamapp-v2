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
  filters?: string;
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
    throw new Error(`Dailymotion API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const searchDailymotion = async (options: SearchOptions): Promise<DailymotionResponse<DailymotionVideo>> => {
  const { query, limit = 10, page = 1, duration_min, duration_max, filters } = options;
  
  const params: Record<string, string> = {
    search: query,
    limit: limit.toString(),
    page: page.toString(),
    fields: 'id,title,duration,views_total,url,embed_url,thumbnail_720_url,owner,created_time,tags,description',
  };

  if (duration_min) params.duration_min = duration_min.toString();
  if (duration_max) params.duration_max = duration_max.toString();
  if (filters) params.filters = filters;

  return fetchFromDailymotion<DailymotionResponse<DailymotionVideo>>('/videos', params);
};

export const getVideoDetails = async (videoId: string): Promise<DailymotionVideo> => {
  return fetchFromDailymotion<DailymotionVideo>(`/video/${videoId}`, {
    fields: 'id,title,duration,views_total,url,embed_url,thumbnail_720_url,owner,created_time,tags,description',
  });
};

export const searchFullMovie = async (movieTitle: string, year?: number): Promise<DailymotionVideo | null> => {
  const query = year ? `${movieTitle} ${year} full movie` : `${movieTitle} full movie`;
  
  try {
    const response = await searchDailymotion({
      query,
      limit: 5,
      duration_min: 60 * 60,
      filters: 'hd',
    });

    const fullMovies = response.list.filter(
      (video) => video.duration >= 60 * 60 && video.duration <= 4 * 60 * 60
    );

    if (fullMovies.length === 0) return null;

    fullMovies.sort((a, b) => b.views_total - a.views_total);
    return fullMovies[0];
  } catch {
    return null;
  }
};

export const searchTrailers = async (movieTitle: string, year?: number): Promise<DailymotionVideo[]> => {
  const query = year ? `${movieTitle} ${year} trailer` : `${movieTitle} trailer`;
  
  try {
    const response = await searchDailymotion({
      query,
      limit: 5,
      duration_max: 10 * 60,
    });

    return response.list.filter((video) => video.duration <= 10 * 60);
  } catch {
    return [];
  }
};

export type { DailymotionVideo, DailymotionResponse, SearchOptions };
