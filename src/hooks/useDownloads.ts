import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Download, QualityOption } from '@/types';

interface AddDownloadInput {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  quality: QualityOption;
}

export const useDownloads = () => {
  return useQuery<Download[], Error>({
    queryKey: ['downloads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .eq('user_id', user.id)
        .order('downloaded_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Download[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddDownload = () => {
  const queryClient = useQueryClient();

  return useMutation<Download, Error, AddDownloadInput>({
    mutationFn: async (input) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('downloads')
        .insert({
          user_id: user.id,
          tmdb_id: input.tmdb_id,
          title: input.title,
          poster_url: input.poster_url,
          quality: input.quality,
          status: 'downloading',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Download;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });
};

export const useDeleteDownload = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (downloadId) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('downloads')
        .delete()
        .eq('id', downloadId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });
};

export const useCheckDownload = (tmdbId: number) => {
  return useQuery<Download | null, Error>({
    queryKey: ['downloads', 'check', tmdbId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as Download | null;
    },
    enabled: tmdbId > 0,
    staleTime: 1000 * 60 * 5,
  });
};