import React, { useState } from 'react';
import { useCommunityVideos, useCommunityVideoVote, useDeleteCommunityVideo } from '@/hooks/useCommunityVideos';
import CommunityVideoCard from './CommunityVideoCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Check, X, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModerationPanelProps {
  className?: string;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: videos, isLoading } = useCommunityVideos('pending');
  const { mutate: voteVideo } = useCommunityVideoVote();
  const { mutate: deleteVideo } = useDeleteCommunityVideo();

  const filteredVideos = videos?.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleVote = (videoId: string, vote: 1 | -1) => {
    voteVideo({ videoId, vote });
  };

  const handleDelete = (videoId: string) => {
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteVideo(videoId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      youtube: 'bg-red-600',
      dailymotion: 'bg-blue-600',
      vimeo: 'bg-blue-500',
      twitch: 'bg-purple-600',
      facebook: 'bg-blue-800',
      vevo: 'bg-black',
      other: 'bg-gray-600',
    };
    return colors[provider] || 'bg-gray-600';
  };

  const handleViewDetails = (video: any) => {
    setSelectedVideo(video);
    setIsDetailsOpen(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Moderation Panel</h2>
          <p className="text-neutral-500">Review and approve community video submissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/[0.04] border-white/[0.08] w-full md:w-64"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className="capitalize"
              >
                {status}
                {status !== 'all' && videos && videos.filter(v => v.status === status).length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {videos.filter(v => v.status === status).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 animate-pulse">
              <div className="aspect-[2/3] bg-white/10 rounded-lg mb-4" />
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No videos found</h3>
          <p className="text-neutral-500">
            {statusFilter === 'pending'
              ? 'No pending videos to review.'
              : 'No videos match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <CommunityVideoCard
              key={video.id}
              video={video}
              onClick={() => handleViewDetails(video)}
            />
          ))}
        </div>
      )}

      {selectedVideo && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-80vh overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Video Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={cn('capitalize', getStatusColor(selectedVideo.status))} variant="outline">
                  {selectedVideo.status}
                </Badge>
                <Badge className={cn('text-white', getProviderColor(selectedVideo.provider))} variant="secondary">
                  {selectedVideo.provider.toUpperCase()}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedVideo.title}</h3>
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <span>Language: {selectedVideo.language.toUpperCase()}</span>
                  <span>Year: {selectedVideo.year || 'N/A'}</span>
                  <span>Submitted: {new Date(selectedVideo.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-300 mb-2">URL:</p>
                <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                  {selectedVideo.url}
                </a>
              </div>
              {selectedVideo.tmdb_id && (
                <div>
                  <p className="text-sm text-neutral-300 mb-2">TMDB ID: {selectedVideo.tmdb_id}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-white/08">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm">+{selectedVideo.vote_count} votes</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => {
                      handleVote(selectedVideo.id, 1);
                      setSelectedVideo({...selectedVideo, status: 'approved'});
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      handleVote(selectedVideo.id, -1);
                      setSelectedVideo({...selectedVideo, status: 'rejected'});
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:bg-red-500/10"
                    onClick={() => handleDelete(selectedVideo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ModerationPanel;