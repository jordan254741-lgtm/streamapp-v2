import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getProviderLabel, getProviderColor } from '@/lib/embed';
import type { CommunityVideo } from '@/types';

interface CommunityVideoCardProps {
  video: CommunityVideo;
  onClick?: () => void;
}

const CommunityVideoCard: React.FC<CommunityVideoCardProps> = ({ video, onClick }) => {
  const posterUrl = video.poster_url
    ? video.poster_url
    : 'https://via.placeholder.com/500x750/111/333?text=No+Image';

  const year = video.year ?? 'N/A';
  const providerLabel = getProviderLabel(video.provider);
  const providerColor = getProviderColor(video.provider);

  return (
    <Card
      className="w-full bg-transparent border-0 text-white overflow-hidden shadow-none hover:shadow-none cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-xl">
        <img
          src={posterUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-2.5 right-2.5 bg-black/60 glass-subtle backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg">
          +{video.vote_count}
        </div>
        <div className="absolute bottom-2.5 left-2.5">
          <span className={`${providerColor} text-white text-[10px] font-semibold px-2 py-0.5 rounded-md`}>
            {providerLabel}
          </span>
        </div>
      </div>
      <CardContent className="p-2 px-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="bg-white/10 text-white/70 text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            Community
          </span>
        </div>
        <h3 className="text-sm font-semibold truncate text-white/90 group-hover:text-white transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">{year}</p>
      </CardContent>
    </Card>
  );
};

export default CommunityVideoCard;
