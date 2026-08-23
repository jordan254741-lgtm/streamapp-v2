import { useEffect, useMemo, useState } from 'react';
import { useRequests, useSubmitRequest, useVoteRequest, useHasVoted } from '@/hooks/useRequests';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageMeta } from '@/hooks/usePageMeta';
import { searchMovies } from '@/lib/tmdb';
import { RequestCard, RequestCardSkeleton } from '@/components/requests/RequestCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, XIcon, SearchIcon, AlertTriangleIcon } from 'lucide-react';
import type { Movie, Request } from '@/types';

type StatusFilter = 'all' | Request['status'];
type SortMode = 'votes' | 'newest';

const statusTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sourcing', label: 'Sourcing' },
  { key: 'available', label: 'Available' },
];

const normalizeTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

const Requests = () => {
  usePageMeta({
    title: 'Requests',
    description: 'Request movies you want to see added to StreamApp.',
  });
  const { data: requests, isLoading: isLoadingRequests } = useRequests();
  const submitRequest = useSubmitRequest();
  const voteRequest = useVoteRequest();

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('votes');

  // Form state
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [language, setLanguage] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedTitle = useDebounce(title, 350);

  // TMDB autocomplete (skipped when a movie is already picked)
  useEffect(() => {
    if (!showForm || selectedMovie || debouncedTitle.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    searchMovies(debouncedTitle.trim())
      .then((response) => {
        if (!cancelled) setSuggestions(response.results.slice(0, 6));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTitle, showForm, selectedMovie]);

  const duplicate = useMemo(() => {
    if (!requests || title.trim().length < 3) return null;
    const normalized = normalizeTitle(title);
    return (
      requests.find(
        (r) => normalizeTitle(r.title) === normalized && r.status !== 'rejected',
      ) ?? null
    );
  }, [requests, title]);

  const pickSuggestion = (movie: Movie) => {
    setSelectedMovie(movie);
    setTitle(movie.title);
    setSuggestions([]);
    if (movie.release_date) setReleaseYear(movie.release_date.split('-')[0]);
    if (movie.original_language) setLanguage(movie.original_language);
  };

  const clearSelection = () => {
    setSelectedMovie(null);
    setTitle('');
    setReleaseYear('');
    setLanguage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    submitRequest.mutate(
      {
        title: title.trim(),
        release_year: releaseYear ? parseInt(releaseYear, 10) : null,
        language: language.trim() || 'en',
        notes: notes.trim(),
        tmdb_id: selectedMovie?.id ?? null,
        poster_url:
          selectedMovie?.poster_path
            ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
            : null,
      },
      {
        onSuccess: () => {
          clearSelection();
          setNotes('');
          setShowForm(false);
        },
      },
    );
  };

  const handleVote = (requestId: string, vote: 1 | -1) => {
    voteRequest.mutate({ requestId, vote });
  };

  const visibleRequests = useMemo(() => {
    if (!requests) return [];
    const filtered =
      statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter);
    return [...filtered].sort((a, b) =>
      sortMode === 'votes'
        ? b.vote_count - a.vote_count || b.created_at.localeCompare(a.created_at)
        : b.created_at.localeCompare(a.created_at),
    );
  }, [requests, statusFilter, sortMode]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = { all: 0, pending: 0, sourcing: 0, available: 0, rejected: 0 };
    for (const r of requests ?? []) {
      base.all += 1;
      base[r.status] += 1;
    }
    return base;
  }, [requests]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Requests</h1>
            <p className="text-neutral-500 text-sm mt-1">Vote on what to add next</p>
          </div>
          <Button
            onClick={() => setShowForm((prev) => !prev)}
            variant={showForm ? 'ghost' : 'outline'}
            size="sm"
            className="gap-1.5"
          >
            {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'New Request'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 md:p-6 mb-8 space-y-4">
            <div className="space-y-1.5 relative">
              <Label htmlFor="title">Title</Label>
              {selectedMovie ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-2.5">
                  {selectedMovie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                      alt=""
                      className="w-10 rounded-md"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedMovie.title}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {selectedMovie.release_date?.split('-')[0]}
                      {selectedMovie.vote_average ? ` · ★ ${selectedMovie.vote_average.toFixed(1)}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Start typing a movie title..."
                    autoComplete="off"
                    required
                  />
                  {(isSearching || suggestions.length > 0) && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden">
                      {isSearching && suggestions.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-neutral-500 flex items-center gap-2">
                          <SearchIcon className="h-3.5 w-3.5 animate-spin" />
                          Searching...
                        </p>
                      ) : (
                        suggestions.map((movie) => (
                          <button
                            key={movie.id}
                            type="button"
                            onClick={() => pickSuggestion(movie)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors"
                          >
                            {movie.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                alt=""
                                className="w-9 rounded-md"
                              />
                            ) : (
                              <div className="w-9 aspect-[2/3] rounded-md bg-white/[0.05]" />
                            )}
                            <span className="min-w-0">
                              <span className="block text-sm font-medium truncate">{movie.title}</span>
                              <span className="block text-xs text-neutral-500">
                                {movie.release_date?.split('-')[0] ?? '—'}
                                {movie.overview ? ` · ${movie.overview.slice(0, 60)}...` : ''}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
              {!selectedMovie && (
                <p className="text-xs text-neutral-600">
                  Tip: pick a suggestion to link TMDB details and get a poster.
                </p>
              )}
            </div>

            {duplicate && !selectedMovie && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300">
                <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  A similar request already exists ({duplicate.title}
                  {duplicate.release_year ? `, ${duplicate.release_year}` : ''}) with{' '}
                  {duplicate.vote_count} vote{duplicate.vote_count === 1 ? '' : 's'} — consider upvoting it instead.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year">Release Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="2024"
                  min={1900}
                  max={2100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="en"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={3}
                className="flex w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 outline-none focus:border-white/20 focus:bg-white/[0.07]"
              />
            </div>

            <Button
              type="submit"
              disabled={submitRequest.isPending || !title.trim()}
              className="font-semibold"
            >
              {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 h-8 rounded-full text-xs font-medium border transition-all duration-150 ${
                  statusFilter === tab.key
                    ? 'bg-white text-black border-white'
                    : 'border-white/10 text-neutral-400 hover:text-white hover:border-white/25'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 ${statusFilter === tab.key ? 'text-black/60' : 'text-neutral-600'}`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {(['votes', 'newest'] as SortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`px-3 h-8 rounded-lg font-medium transition-colors ${
                  sortMode === mode ? 'bg-white/[0.08] text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                {mode === 'votes' ? 'Top Voted' : 'Newest'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isLoadingRequests ? (
            Array.from({ length: 6 }).map((_, i) => <RequestCardSkeleton key={i} />)
          ) : visibleRequests.length > 0 ? (
            visibleRequests.map((req) => (
              <VoteableRequestCard
                key={req.id}
                request={req}
                onVote={handleVote}
              />
            ))
          ) : (
            <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-neutral-300 font-medium mb-1">
                {statusFilter === 'all' ? 'No requests yet' : 'No requests with this status'}
              </p>
              <p className="text-neutral-500 text-sm">Be the first to request a movie!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VoteableRequestCard = ({
  request,
  onVote,
}: {
  request: Request;
  onVote: (id: string, vote: 1 | -1) => void;
}) => {
  const { data: hasVoted, isLoading: isCheckingVote } = useHasVoted(request.id);

  return (
    <RequestCard
      request={request}
      hasVoted={hasVoted ?? false}
      isVoting={isCheckingVote}
      onVote={() => onVote(request.id, hasVoted ? -1 : 1)}
    />
  );
};

export default Requests;
