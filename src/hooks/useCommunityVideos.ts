import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getEmbedInfo } from '@/lib/embed';
import type { CommunityVideo } from '@/types';

interface SubmitCommunityVideoInput {
  title: string;
  url: string;
  year: number | null;
  language: string;
  tmdb_id: number | null;
  poster_url: string | null;
}

export const useCommunityVideos = (status: CommunityVideo['status'] = 'approved') => {
  return useQuery<CommunityVideo[], Error>({
    queryKey: ['community_videos', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_videos')
        .select('*')
        .eq('status', status)
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as CommunityVideo[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useMyCommunityVideos = () => {
  return useQuery<CommunityVideo[], Error>({
    queryKey: ['community_videos', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_videos')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as CommunityVideo[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useSubmitCommunityVideo = () => {
  const queryClient = useQueryClient();

  return useMutation<CommunityVideo, Error, SubmitCommunityVideoInput>({
    mutationFn: async (input) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const embedInfo = getEmbedInfo(input.url);
      if (!embedInfo) throw new Error('Unsupported video platform. Supported: YouTube, Dailymotion, Vimeo, Twitch, Facebook, Vevo.');

      const { data, error } = await supabase
        .from('community_videos')
        .insert({
          title: input.title,
          url: input.url,
          embed_url: embedInfo.embedUrl,
          provider: embedInfo.provider,
          submitted_by: user.id,
          tmdb_id: input.tmdb_id,
          year: input.year,
          language: input.language,
          poster_url: input.poster_url,
          vote_count: 0,
          status: 'approved',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as CommunityVideo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_videos'] });
    },
  });
};

export const useCommunityVideoVote = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { videoId: string; vote: 1 | -1 }>({
    mutationFn: async ({ videoId, vote }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('community_votes')
        .select('vote')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: video } = await supabase
        .from('community_videos')
        .select('vote_count')
        .eq('id', videoId)
        .single();

      let delta = 0;
      const currentCount = (video as { vote_count: number } | null)?.vote_count ?? 0;

      if (existing) {
        if (existing.vote === vote) {
          await supabase
            .from('community_votes')
            .delete()
            .eq('video_id', videoId)
            .eq('user_id', user.id);
          delta = -vote;
        } else {
          await supabase
            .from('community_votes')
            .update({ vote })
            .eq('video_id', videoId)
            .eq('user_id', user.id);
          delta = vote - existing.vote;
        }
      } else {
        const { error } = await supabase
          .from('community_votes')
          .insert({ user_id: user.id, video_id: videoId, vote });

        if (error && error.code !== '23505') throw new Error(error.message);
        if (!error || error.code === '23505') {
          delta = vote;
        }
      }

      if (delta !== 0) {
        await supabase
          .from('community_videos')
          .update({ vote_count: currentCount + delta })
          .eq('id', videoId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_videos'] });
    },
  });
};

export const useMyVideoVote = (videoId: string) => {
  return useQuery<number | null, Error>({
    queryKey: ['community_votes', videoId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('community_votes')
        .select('vote')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data?.vote ?? null;
    },
    enabled: !!videoId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useDeleteCommunityVideo = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (videoId) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_videos')
        .delete()
        .eq('id', videoId)
        .eq('submitted_by', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_videos'] });
    },
  });
};