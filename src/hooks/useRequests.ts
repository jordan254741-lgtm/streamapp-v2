import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Request } from '@/types';

interface SubmitRequestInput {
  title: string;
  release_year: number | null;
  language: string | null;
  notes: string | null;
}

interface UseRequestsOptions {
  status?: Request['status'];
}

export const useRequests = ({ status }: UseRequestsOptions = {}) => {
  return useQuery<Request[], Error>({
    queryKey: ['requests', status],
    queryFn: async () => {
      let query = supabase
        .from('requests')
        .select(`
          *,
          profiles:user_id (username),
          request_votes (user_id)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Request[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useMyRequests = () => {
  return useQuery<Request[], Error>({
    queryKey: ['requests', 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          profiles:user_id (username),
          request_votes (user_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Request[];
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSubmitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<Request, Error, SubmitRequestInput>({
    mutationFn: async (input) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          title: input.title,
          release_year: input.release_year,
          language: input.language,
          notes: input.notes,
          vote_count: 0,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
};

export const useVoteRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { requestId: string; vote: 1 | -1 }>({
    mutationFn: async ({ requestId, vote }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (vote === 1) {
        const { error } = await supabase
          .from('request_votes')
          .insert({ user_id: user.id, request_id: requestId });

        if (error && error.code !== '23505') throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('request_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('request_id', requestId);

        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
};

export const useHasVoted = (requestId: string) => {
  return useQuery<boolean, Error>({
    queryKey: ['requests', 'hasVoted', requestId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('request_votes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('request_id', requestId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return !!data;
    },
    enabled: !!requestId,
    staleTime: 1000 * 60 * 5,
  });
};