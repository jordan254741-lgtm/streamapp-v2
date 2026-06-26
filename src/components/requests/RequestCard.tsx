import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUpIcon } from 'lucide-react';
import type { Request } from '@/types';

const statusConfig: Record<Request['status'], { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  sourcing: { label: 'Sourcing', classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  available: { label: 'Available', classes: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: 'Rejected', classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

interface RequestCardProps {
  request: Request;
  hasVoted: boolean;
  onVote: () => void;
  isVoting: boolean;
}

const RequestCardSkeleton = () => (
  <Card className="w-full bg-gray-900 border-gray-800">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
    </CardContent>
  </Card>
);

const RequestCard = ({ request, hasVoted, onVote, isVoting }: RequestCardProps) => {
  const status = statusConfig[request.status];

  return (
    <Card className="w-full bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-base truncate">{request.title}</h3>
              {request.release_year && (
                <span className="text-gray-400 text-sm whitespace-nowrap">({request.release_year})</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span>{request.language.toUpperCase()}</span>
            </div>
            {request.notes && (
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{request.notes}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${status.classes}`}>
              {status.label}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex items-center gap-3">
        <Button
          onClick={onVote}
          disabled={isVoting}
          variant={hasVoted ? 'default' : 'outline'}
          size="sm"
          className={`gap-1 ${hasVoted ? 'bg-white text-black hover:bg-gray-200' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
        >
          <ChevronUpIcon className="h-4 w-4" />
          <span>{request.vote_count}</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { RequestCard, RequestCardSkeleton };
