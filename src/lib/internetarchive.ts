const IA_SEARCH_URL = 'https://archive.org/advancedsearch.php';

interface ArchiveItem {
  identifier: string;
  title: string;
  description?: string;
  downloads?: number;
  year?: number;
  mediatype: string;
}

interface SearchResult {
  id: string;
  title: string;
  embedUrl: string;
  thumbnail: string;
  duration: number;
  views: number;
}

export const searchArchiveMovies = async (
  movieTitle: string,
  year?: number
): Promise<ArchiveItem[]> => {
  try {
    let query = `title:(${encodeURIComponent(movieTitle)}) AND mediatype:movies`;
    if (year) {
      query += ` AND year:${year}`;
    }

    const url = `${IA_SEARCH_URL}?q=${query}&fl[]=identifier,title,description,downloads,year,mediatype&sort[]=downloads+desc&rows=10&output=json`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const docs: ArchiveItem[] = json?.response?.docs ?? [];
    return docs.filter((d) => d.identifier && d.title);
  } catch {
    return [];
  }
};

export const getArchiveEmbedUrl = (identifier: string): string => {
  return `https://archive.org/embed/${identifier}`;
};

export const searchInternetArchive = async (
  movieTitle: string,
  year?: number
): Promise<SearchResult[]> => {
  try {
    const results = await searchArchiveMovies(movieTitle, year);
    return results.map((video) => ({
      id: `archive-${video.identifier}`,
      title: video.title,
      embedUrl: `https://archive.org/embed/${video.identifier}`,
      thumbnail: `https://archive.org/services/img/${video.identifier}`,
      duration: 0,
      views: video.downloads || 0,
    }));
  } catch {
    return [];
  }
};