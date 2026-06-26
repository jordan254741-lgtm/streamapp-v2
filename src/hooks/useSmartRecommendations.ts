/** Zero-Budget Smart Personalization Engine */
import { useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Movie } from '@/lib/tmdb';

interface WatchHistory {
  movieId: number;
  watchTime: number;
  watchDate: string;
  completed: boolean;
  rating?: number;
}

interface UserPreferences {
  genres: number[];
  mood: 'happy' | 'sad' | 'adventure' | 'relaxing' | 'thriller';
  timeOfDay: 'morning' | 'afternoon' | 'evening' ;
  preferredQuality: '480p' | '720p' | '1080p';
}

interface SmartRecommendation {
  movie: Movie;
  reason: string;
  score: number;
  category: 'continue-watching' | 'trending' | 'mood-match' | 'time-appropriate';
}

interface SmartRecommendationsHook {
  recommendations: SmartRecommendation[];
  watchHistory: WatchHistory[];
  userPreferences: UserPreferences;
  addToWatchHistory: (movieId: number, completed?: boolean) => void;
  setMood: (mood: UserPreferences['mood']) => void;
  getContinueWatching: (movies: Movie[]) => Movie[];
  getSimilarMovies: (movieId: number, availableMovies: Movie[]) => Movie[];
}

export const useSmartRecommendations = (): SmartRecommendationsHook => {
  const [watchHistory, setWatchHistory] = useLocalStorage<WatchHistory[]>('smart-watch-history', []);
  const [userPreferences, setUserPreferences] = useLocalStorage<UserPreferences>('smart-preferences', {
    genres: [],
    mood: 'adventure',
    timeOfDay: 'evening',
    preferredQuality: '720p',
  });

  const getTimeBasedTheme = useCallback((): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  }, []);

  const getMoodBasedGenres = useCallback((mood: UserPreferences['mood']): number[] => {
    const moodGenres: Record<UserPreferences['mood'], number[]> = {
      happy: [35, 10751, 16],
      sad: [18, 36, 37],
      adventure: [28, 12, 14],
      relaxing: [35, 10749, 53],
      thriller: [53, 80, 9648],
    };
    return moodGenres[mood] || [];
  }, []);

  const getSimilarMovies = useCallback((movieId: number, availableMovies: Movie[]): Movie[] => {
    if (!watchHistory.length) return [];
    
    const watchedMovie = watchHistory.find(h => h.movieId === movieId);
    if (!watchedMovie) return [];
    
    const similarByGenre = availableMovies.filter(movie => 
      movie.id !== movieId &&
      movie.genre_ids.some(id => watchHistory.some(h => 
        availableMovies.find(m => m.id === h.movieId)?.genre_ids.includes(id)
      ))
    );
    
    return similarByGenre.slice(0, 5);
  }, [watchHistory]);

  const getTrendingRecommendations = useCallback((availableMovies: Movie[]): SmartRecommendation[] => {
    if (!availableMovies.length) return [];
    
    const trending = [...availableMovies]
      .sort((a, b) => b.vote_average - a.vote_average)
      .filter(movie => movie.vote_count > 100)
      .slice(0, 10);
    
    return trending.map(movie => ({
      movie,
      reason: 'Trending now with high ratings',
      score: movie.vote_average / 10,
      category: 'trending' as const,
    }));
  }, []);

  const getMoodRecommendations = useCallback((availableMovies: Movie[]): SmartRecommendation[] => {
    const moodGenres = getMoodBasedGenres(userPreferences.mood);
    const moodMovies = availableMovies.filter(movie =>
      moodGenres.some(genreId => movie.genre_ids.includes(genreId))
    );
    
    const maxScore = Math.max(...moodMovies.map(m => m.vote_average), 0);
    if (maxScore === 0) return [];
    
    return moodMovies
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 8)
      .map(movie => ({
        movie,
        reason: `Perfect for your ${userPreferences.mood} mood`,
        score: (movie.vote_average / 10) * 1.2,
        category: 'mood-match' as const,
      }));
  }, [userPreferences.mood, getMoodBasedGenres]);

  const getTimeAppropriateRecommendations = useCallback((availableMovies: Movie[]): SmartRecommendation[] => {
    const currentTime = getTimeBasedTheme();
    
    if (currentTime === 'evening') {
      const eveningMovies = availableMovies.filter(m => 
        m.genre_ids.some(id => [53, 80, 9648, 28].includes(id))
      );
      return eveningMovies
        .slice(0, 6)
        .map(movie => ({
          movie,
          reason: 'Perfect for an evening viewing session',
          score: (movie.vote_average / 10) * 1.1,
          category: 'time-appropriate' as const,
        }));
    }
    
    return availableMovies
      .filter(movie => {
        const movieHour = new Date(movie.release_date || '').getHours();
        return movieHour > 0;
      })
      .slice(0, 6)
      .map(movie => ({
        movie,
        reason: `Great choice for ${currentTime} viewing`,
        score: (movie.vote_average / 10) * 1.0,
        category: 'time-appropriate' as const,
      }));
  }, [getTimeBasedTheme]);

  const getCombinedRecommendations = useCallback((availableMovies: Movie[]): SmartRecommendation[] => {
    const watchHistoryMovies = watchHistory.map(h => h.movieId);
    const continueWatching = availableMovies
      .filter(movie => watchHistoryMovies.includes(movie.id))
      .sort((a, b) => {
        const aTime = watchHistory.find(h => h.movieId === a.id)?.watchTime || 0;
        const bTime = watchHistory.find(h => h.movieId === b.id)?.watchTime || 0;
        return bTime - aTime;
      })
      .slice(0, 3)
      .map(movie => ({
        movie,
        reason: `Continue watching ${movie.title}`,
        score: 1.0,
        category: 'continue-watching' as const,
      }));

    const trending = getTrendingRecommendations(availableMovies);
    const mood = getMoodRecommendations(availableMovies);
    const time = getTimeAppropriateRecommendations(availableMovies);

    const allRecommendations = [...continueWatching, ...trending, ...mood, ...time];
    
    return allRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [watchHistory, getTrendingRecommendations, getMoodRecommendations, getTimeAppropriateRecommendations]);

  const addToWatchHistory = useCallback((movieId: number, completed: boolean = false) => {
    const newHistoryEntry: WatchHistory = {
      movieId,
      watchTime: Date.now(),
      watchDate: new Date().toISOString(),
      completed,
      rating: undefined,
    };

    setWatchHistory(prev => [newHistoryEntry, ...prev].slice(0, 50));
  }, [setWatchHistory]);

  const setMood = useCallback((mood: UserPreferences['mood']) => {
    setUserPreferences(prev => ({ ...prev, mood }));
  }, [setUserPreferences]);

  const getContinueWatching = useCallback((movies: Movie[]): Movie[] => {
    const recentWatchHistory = watchHistory
      .filter(h => h.completed)
      .sort((a, b) => b.watchTime - a.watchTime)
      .slice(0, 5);
    
    return recentWatchHistory
      .map(history => movies.find(m => m.id === history.movieId))
      .filter(Boolean) as Movie[];
  }, [watchHistory]);

  const recommendations = useMemo(() => {
    return getCombinedRecommendations([]);
  }, [getCombinedRecommendations]);

  return {
    recommendations,
    watchHistory,
    userPreferences,
    addToWatchHistory,
    setMood,
    getContinueWatching,
    getSimilarMovies,
  };
};
