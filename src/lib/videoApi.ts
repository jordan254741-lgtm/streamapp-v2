import { supabase } from '../lib/supabase';
import type { Video } from '@/types';

interface UpsertVideoInput {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  embed_url?: string;
  provider?: string;
  duration?: number;
  thumbnail?: string;
  quality?: string;
  language?: string;
  year?: number;
  genres?: string[];
  file_path?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  upload_type?: 'self-hosted' | 'external' | 'direct';
  tmdb_id?: number;
  poster_url?: string;
  is_subtitled?: boolean;
  is_encoded?: boolean;
}

interface VideoProcessingJob {
  id: string;
  video_id: string;
  input_path: string;
  output_path?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  quality?: string;
  created_at: string;
  completed_at?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Video upload and management API functions

export const uploadVideo = async (input: UpsertVideoInput): Promise<Video> => {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      id: input.id || crypto.randomUUID(),
      title: input.title,
      description: input.description,
      url: input.url,
      embed_url: input.embed_url,
      provider: input.provider,
      duration: input.duration,
      thumbnail: input.thumbnail,
      quality: input.quality,
      language: input.language,
      year: input.year,
      genres: input.genres,
      file_path: input.file_path,
      status: input.status || 'pending',
      upload_type: input.upload_type || 'self-hosted',
      tmdb_id: input.tmdb_id,
      poster_url: input.poster_url,
      is_subtitled: input.is_subtitled,
      is_encoded: input.is_encoded,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Trigger video processing if it's a direct upload
  if (input.upload_type === 'self-hosted' && input.file_path) {
    await queueVideoForProcessing(data.id);
  }

  return data;
};

export const updateVideo = async (videoId: string, updates: Partial<UpsertVideoInput>): Promise<Video> => {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // If status changed to completed, trigger thumbnail generation
  if (updates.status === 'completed' && data.thumbnail) {
    await generateThumbnail(videoId, data.thumbnail);
  }

  return data;
};

export const getVideo = async (videoId: string): Promise<Video | null> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
};

export const getVideos = async (filters?: {
  status?: string;
  quality?: string;
  upload_type?: string;
  year?: number;
  limit?: number;
  offset?: number;
}): Promise<Video[]> => {
  let query = supabase.from('videos').select('*');

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.quality) query = query.eq('quality', filters.quality);
  if (filters?.upload_type) query = query.eq('upload_type', filters.upload_type);
  if (filters?.year) query = query.eq('year', filters.year);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (error) throw new Error(error.message);

  // Clean up associated files
  await cleanupVideoFiles(videoId);
};

export const queueVideoForProcessing = async (videoId: string, quality?: string): Promise<string> => {
  const { data, error } = await supabase
    .from('video_processing_jobs')
    .insert({
      id: crypto.randomUUID(),
      video_id: videoId,
      input_path: `/uploads/${videoId}.mp4`,
      status: 'pending',
      progress: 0,
      quality,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data.id;
};

export const getProcessingJob = async (jobId: string): Promise<VideoProcessingJob | null> => {
  const { data, error } = await supabase
    .from('video_processing_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
};

export const updateProcessingJob = async (jobId: string, updates: Partial<VideoProcessingJob>): Promise<VideoProcessingJob> => {
  const { data, error } = await supabase
    .from('video_processing_jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (updates.status === 'completed' && updates.completed_at) {
    await updateVideo(data.video_id, { status: 'completed' });
  }

  return data;
};

export const generateThumbnail = async (videoId: string, thumbnailUrl: string): Promise<void> => {
  try {
    const response = await fetch('/api/thumbnails/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, thumbnailUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate thumbnail');
    }
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
  }
};

export const cleanupVideoFiles = async (videoId: string): Promise<void> => {
  try {
    await supabase.storage.from('video-uploads').remove([`${videoId}.mp4`, `${videoId}.jpg`]);
  } catch (error) {
    console.error('Failed to cleanup video files:', error);
  }
};

export const getVideoStats = async (): Promise<Record<string, number>> => {
  const [videosCount, pendingCount, processingCount, completedCount, failedCount] = await Promise.all([
    supabase.from('videos').select('*', { count: 'exact', head: true }).then(({ count }) => count || 0),
    supabase.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'pending').then(({ count }) => count || 0),
    supabase.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'processing').then(({ count }) => count || 0),
    supabase.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'completed').then(({ count }) => count || 0),
    supabase.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'failed').then(({ count }) => count || 0),
  ]);

  return {
    total: videosCount,
    pending: pendingCount,
    processing: processingCount,
    completed: completedCount,
    failed: failedCount,
  };
};