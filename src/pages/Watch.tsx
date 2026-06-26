import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCommunityVideos, useCommunityVideoVote, useMyVideoVote } from '@/hooks/useCommunityVideos';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getProviderLabel } from '@/lib/embed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: videos, isLoading } = useCommunityVideos();
  const voteMutation = useCommunityVideoVote();

  const video = videos?.find((v) => v.id === id);
  const { data: myVote } = useMyVideoVote(id ?? '');

  usePageMeta({
    title: video ? `Watch ${video.title}` : 'Watch',
    description: video ? `Watch ${video.title} on StreamApp` : 'Watch a community video on StreamApp.',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-4xl p-4">
          <Skeleton className="aspect-video w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-64 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <p className="text-neutral-400 text-lg">Video not found</p>
        <Link to="/browse">
          <Button variant="outline">Back to Browse</Button>
        </Link>
      </div>
    );
  }

  const handleUpvote = () => {
    voteMutation.mutate({ videoId: video.id, vote: 1 });
  };

  const handleDownvote = () => {
    voteMutation.mutate({ videoId: video.id, vote: -1 });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/browse"
          className="text-neutral-500 hover:text-white transition-colors mb-6 inline-flex items-center gap-1.5 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Browse
        </Link>

        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden mb-6 border border-white/[0.06]">
          <iframe
            src={video.embed_url}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
              {video.year && <span>{video.year}</span>}
              <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                Community
              </span>
              <span className="text-neutral-600">·</span>
              <span>{getProviderLabel(video.provider)}</span>
              {video.language && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="uppercase text-xs">{video.language}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              onClick={handleUpvote}
              variant="outline"
              size="sm"
              disabled={voteMutation.isPending}
              className={`gap-1.5 ${myVote === 1 ? 'bg-white/10 border-white/20 text-white' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
              {myVote === 1 ? 'Upvoted' : 'Upvote'}
            </Button>
            <span className="text-lg font-semibold min-w-[2.5ch] text-center text-white/80">
              {video.vote_count}
            </span>
            <Button
              onClick={handleDownvote}
              variant="outline"
              size="sm"
              disabled={voteMutation.isPending}
              className={`${myVote === -1 ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
