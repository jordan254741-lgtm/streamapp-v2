import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUpIcon } from 'lucide-react';
import type { Request } from '@/types';

const statusConfig: Record<Request['status'], { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  sourcing: { label: 'Sourcing', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  available: { label: 'Available', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejected', classes: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
};

interface RequestCardProps {
  request: Request;
  hasVoted: boolean;
  onVote: () => void;
  isVoting: boolean;
}

const RequestCardSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
    </CardContent>
  </Card>
);

const RequestCard = ({ request, hasVoted, onVote, isVoting }: RequestCardProps) => {
  const status = statusConfig[request.status];

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-base truncate">{request.title}</h3>
              {request.release_year && (
                <span className="text-neutral-500 text-sm whitespace-nowrap">({request.release_year})</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
              <span className="uppercase text-xs">{request.language}</span>
            </div>
            {request.notes && (
              <p className="text-neutral-500 text-sm mt-2 line-clamp-2">{request.notes}</p>
            )}
            <p className="text-xs text-neutral-600 mt-2">
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.classes}`}>
              {status.label}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex items-center gap-3">
        <Button
          onClick={onVote}
          disabled={isVoting}
          variant={hasVoted ? 'default' : 'outline'}
          size="sm"
          className={`gap-1.5 ${hasVoted ? 'bg-white text-black hover:bg-white/90' : ''}`}
        >
          <ChevronUpIcon className="h-4 w-4" />
          <span>{request.vote_count}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { RequestCard, RequestCardSkeleton };
