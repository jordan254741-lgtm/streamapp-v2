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
  usePageMeta({ title: 'Requests', description: 'Request movies you want to see added to StreamApp.' });
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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Requests</h1>
          <Button
            onClick={() => setShowForm((prev) => !prev)}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800 gap-1.5"
            size="sm"
          >
            {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'New Request'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 mb-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Movie title"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-gray-300">Release Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="2024"
                  min={1900}
                  max={2100}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language" className="text-gray-300">Language</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="en"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-gray-300">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            <Button
              type="submit"
              disabled={submitRequest.isPending || !title.trim()}
              className="bg-white text-black hover:bg-gray-200 font-semibold"
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
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No requests yet</p>
              <p className="text-gray-600 text-sm mt-1">Be the first to request a movie!</p>
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
