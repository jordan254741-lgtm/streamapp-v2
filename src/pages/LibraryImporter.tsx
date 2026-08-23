import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSubmitCommunityVideo } from '@/hooks/useCommunityVideos';
import { searchAllDailymotion } from '@/lib/dailymotion';
import { searchInternetArchive } from '@/lib/internetarchive';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Tv, Search, Download, AlertCircle, ExternalLink, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscoveredVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  views: number;
  source: 'dailymotion' | 'archive';
  embedUrl: string;
  year: number | null;
}

const SHOWS = [
  { title: 'Mr. Robot', year: 2015, language: 'en' },
  { title: 'Beauty in Black', year: 2024, language: 'en' },
  { title: 'Silicon Valley', year: 2014, language: 'en' },
  { title: 'Game of Thrones', year: 2011, language: 'en' },
];

const LibraryImporter = () => {
  usePageMeta({
    title: 'Discover & Import',
    description: 'Search Dailymotion & Internet Archive for shows and import them directly.',
  });

  const navigate = useNavigate();
  const [customSearch, setCustomSearch] = useState('');
  const [discoveryState, setDiscoveryState] = useState<'idle' | 'searching' | 'results'>('idle');
  const [discoveredVideos, setDiscoveredVideos] = useState<DiscoveredVideo[]>([]);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });
  const submitMutation = useSubmitCommunityVideo();

  const searchAllSources = useCallback(async (title: string, year?: number): Promise<DiscoveredVideo[]> => {
    const results: DiscoveredVideo[] = [];

    const [dmResults, archiveResults] = await Promise.allSettled([
      searchAllDailymotion(title, year),
      searchInternetArchive(title, year),
    ]);

    if (dmResults.status === 'fulfilled') {
      for (const v of dmResults.value) {
        const dmUrl = `https://www.dailymotion.com/video/${v.id}`;
        results.push({
          id: `dm-${v.id}`,
          title: v.title,
          url: dmUrl,
          thumbnail: v.thumbnail_720_url,
          duration: v.duration,
          views: v.views_total,
          source: 'dailymotion',
          embedUrl: v.embed_url,
          year: year ?? null,
        });
      }
    }

    if (archiveResults.status === 'fulfilled') {
      for (const v of archiveResults.value) {
        if (!v.id.match(/^archive-/)) continue;
        results.push({
          id: v.id,
          title: v.title,
          url: v.embedUrl,
          thumbnail: v.thumbnail,
          duration: v.duration,
          views: v.views,
          source: 'archive',
          embedUrl: v.embedUrl,
          year: year ?? null,
        });
      }
    }

    results.sort((a, b) => b.views - a.views);
    return results.slice(0, 30);
  }, []);

  const handleDiscoverAll = useCallback(async () => {
    setDiscoveryState('searching');
    setError(null);
    setDiscoveredVideos([]);
    setImportedIds(new Set());
    setImportingIds(new Set());

    const showsToSearch = customSearch.trim()
      ? [{ title: customSearch.trim(), year: null, language: 'en' }]
      : SHOWS;

    setSearchProgress({ current: 0, total: showsToSearch.length });
    const allResults: DiscoveredVideo[] = [];

    for (let i = 0; i < showsToSearch.length; i++) {
      const show = showsToSearch[i];
      try {
        const results = await searchAllSources(show.title, show.year ?? undefined);
        allResults.push(...results);
      } catch (e) {
        console.error(`Failed to search for ${show.title}:`, e);
      }
      setSearchProgress({ current: i + 1, total: showsToSearch.length });
    }

    setDiscoveredVideos(allResults);
    setDiscoveryState('results');
  }, [customSearch, searchAllSources]);

  const handleImport = useCallback(async (video: DiscoveredVideo) => {
    setImportingIds(prev => new Set(prev).add(video.id));
    try {
      await submitMutation.mutateAsync({
        title: video.title,
        url: video.url,
        year: video.year,
        language: 'en',
        tmdb_id: null,
        poster_url: video.thumbnail,
      });
      setImportedIds(prev => new Set(prev).add(video.id));
    } catch (e) {
      console.error(`Failed to import ${video.title}:`, e);
    } finally {
      setImportingIds(prev => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  }, [submitMutation]);

  const handleImportAll = useCallback(async () => {
    setImportedIds(new Set());
    setImportingIds(new Set());

    for (const video of discoveredVideos) {
      await handleImport(video);
    }
  }, [discoveredVideos, handleImport]);

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatViews = (views: number): string => {
    if (!views) return '';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const importedCount = importedIds.size;
  const totalCount = discoveredVideos.length;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover & Import</h1>
          <p className="text-neutral-500">
            Search Dailymotion and Internet Archive for shows and import them as community videos
          </p>
        </div>

        <Card className="bg-[#0a0a0a] border-white/[0.08] rounded-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-neutral-400 mb-2 block">
                  Search for a specific show (leave empty for defaults: Mr. Robot, Beauty in Black, Silicon Valley, Game of Thrones)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    placeholder="e.g. Breaking Bad, The Office, Rick and Morty..."
                    className="pl-10 bg-white/[0.04] border-white/[0.08] w-full"
                  />
                </div>
              </div>
              <Button
                onClick={handleDiscoverAll}
                disabled={discoveryState === 'searching'}
                className="gap-2 shrink-0"
                size="lg"
              >
                {discoveryState === 'searching' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                ) : (
                  <><Search className="w-4 h-4" /> Discover</>
                )}
              </Button>
            </div>

            {discoveryState === 'searching' && (
              <div className="mt-6">
                <div className="flex items-center gap-3 text-neutral-400 text-sm mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  Searching sources for shows...
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(searchProgress.current / Math.max(searchProgress.total, 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {searchProgress.current} of {searchProgress.total} shows searched
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {discoveryState === 'results' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {totalCount > 0 ? `Found ${totalCount} videos` : 'No videos found'}
                </h2>
                <p className="text-sm text-neutral-500">
                  {importedCount > 0 && `${importedCount} imported`}
                </p>
              </div>
              {totalCount > 0 && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleImportAll}
                    disabled={importedCount === totalCount}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Import All {totalCount}
                  </Button>
                </div>
              )}
            </div>

            {totalCount === 0 ? (
              <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <Tv className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No videos found</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  Could not find any playable videos on Dailymotion or Internet Archive for these shows.
                </p>
                <Button
                  onClick={() => {
                    setCustomSearch('');
                    setDiscoveryState('idle');
                  }}
                  variant="outline"
                >
                  Try a Custom Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveredVideos.map((video) => {
                  const isImporting = importingIds.has(video.id);
                  const isImported = importedIds.has(video.id);

                  return (
                    <Card
                      key={video.id}
                      className={cn(
                        'bg-white/[0.02] border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300',
                        isImported && 'border-emerald-500/30 bg-emerald-500/5',
                      )}
                    >
                      <div className="aspect-video relative overflow-hidden bg-white/5">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.className = 'w-full h-full flex items-center justify-center text-neutral-600';
                            e.currentTarget.innerText = 'No Preview';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 flex gap-2">
                          <Badge
                            variant={video.source === 'dailymotion' ? 'default' : 'secondary'}
                            className="capitalize text-xs"
                          >
                            {video.source}
                          </Badge>
                          {video.duration > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              {formatDuration(video.duration)}
                            </Badge>
                          )}
                        </div>
                        {video.views > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Eye className="w-3 h-3" />
                              {formatViews(video.views)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{video.title}</h3>
                        {video.year && (
                          <p className="text-xs text-neutral-500 mb-3">{video.year}</p>
                        )}
                        <div className="flex gap-2">
                          {isImported ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-400 border-emerald-500/30 pointer-events-none gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Imported
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleImport(video)}
                              disabled={isImporting}
                              size="sm"
                              className="gap-1.5 flex-1"
                            >
                              {isImporting ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing</>
                              ) : (
                                <><Download className="w-3.5 h-3.5" /> Import</>
                              )}
                            </Button>
                          )}
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                          </a>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {totalCount > 0 && importedCount > 0 && (
              <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-emerald-400 mb-1">
                  Successfully imported {importedCount} video{importedCount !== 1 ? 's' : ''}
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Added to the community library. Browse them now.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/browse')} variant="outline">
                    Browse Library
                  </Button>
                  <Button onClick={() => setDiscoveryState('idle')} variant="outline">
                    Discover More
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryImporter;