export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  runtime: number;
  status: string;
  budget: number;
  revenue: number;
  original_language: string;
  production_countries: { name: string }[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Request {
  id: string;
  user_id: string;
  title: string;
  release_year: number | null;
  language: string;
  notes: string;
  vote_count: number;
  status: 'pending' | 'sourcing' | 'available' | 'rejected';
  created_at: string;
}

export interface RequestVote {
  user_id: string;
  request_id: string;
}

export type QualityOption = '480p' | '720p' | '1080p';

export interface Download {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  quality: QualityOption;
  status: 'downloading' | 'ready' | 'failed';
  downloaded_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}
