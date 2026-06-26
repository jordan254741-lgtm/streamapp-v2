import { useState } from 'react';
import { useRequests, useSubmitRequest, useVoteRequest, useHasVoted } from '@/hooks/useRequests';
import { usePageMeta } from '@/hooks/usePageMeta';
import { RequestCard, RequestCardSkeleton } from '@/components/requests/RequestCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, XIcon } from 'lucide-react';
import type { Request } from '@/types';

const Requests = () => {
  usePageMeta({
    title: 'Requests',
    description: 'Request movies you want to see added to StreamApp.',
  });
  const { data: requests, isLoading: isLoadingRequests } = useRequests();
  const submitRequest = useSubmitRequest();
  const voteRequest = useVoteRequest();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [language, setLanguage] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    submitRequest.mutate(
      {
        title: title.trim(),
        release_year: releaseYear ? parseInt(releaseYear, 10) : null,
        language: language.trim() || 'en',
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          setTitle('');
          setReleaseYear('');
          setLanguage('');
          setNotes('');
          setShowForm(false);
        },
      },
    );
  };

  const handleVote = (requestId: string, vote: 1 | -1) => {
    voteRequest.mutate({ requestId, vote });
  };

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
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Movie title"
                required
              />
            </div>

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

        <div className="space-y-3">
          {isLoadingRequests ? (
            Array.from({ length: 6 }).map((_, i) => <RequestCardSkeleton key={i} />)
          ) : requests && requests.length > 0 ? (
            requests.map((req) => (
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
              <p className="text-neutral-300 font-medium mb-1">No requests yet</p>
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
