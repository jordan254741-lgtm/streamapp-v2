import type { VideoProvider } from '@/types';

interface EmbedResult {
  embedUrl: string;
  provider: VideoProvider;
}

export function getEmbedInfo(url: string): EmbedResult | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      const v = host === 'youtu.be'
        ? u.pathname.slice(1)
        : u.searchParams.get('v');
      if (v) {
        return { embedUrl: `https://www.youtube.com/embed/${v}?autoplay=1&rel=0&modestbranding=1`, provider: 'youtube' };
      }
    }

    if (host === 'dailymotion.com' || host === 'dai.ly') {
      const id = host === 'dai.ly'
        ? u.pathname.slice(1)
        : u.pathname.match(/\/video\/([^_/?]+)/)?.[1];
      if (id) {
        return { embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, provider: 'dailymotion' };
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      if (id) {
        return { embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`, provider: 'vimeo' };
      }
    }

    if (host === 'twitch.tv' || host === 'clips.twitch.tv' || host === 'player.twitch.tv') {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'streamapp.com';
      const videoId = u.pathname.match(/\/videos\/(\d+)/)?.[1];
      const clipSlug = host === 'clips.twitch.tv' ? u.pathname.slice(1).replace('/', '') : null;
      if (clipSlug) {
        return { embedUrl: `https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${parent}&autoplay=true`, provider: 'twitch' };
      }
      if (videoId) {
        return { embedUrl: `https://player.twitch.tv/?video=${videoId}&parent=${parent}&autoplay=true`, provider: 'twitch' };
      }
      const channelName = u.pathname.match(/^\/(\w+)/)?.[1];
      if (channelName) {
        return { embedUrl: `https://player.twitch.tv/?channel=${channelName}&parent=${parent}&autoplay=true`, provider: 'twitch' };
      }
    }

    if (host === 'facebook.com' || host === 'fb.watch') {
      if (host === 'fb.watch') {
        const id = u.pathname.slice(1);
        if (id) {
          return { embedUrl: `https://www.facebook.com/plugins/video.php?href=https://fb.watch/${id}/&autoplay=1`, provider: 'facebook' };
        }
      }
      const videoId = u.pathname.match(/\/videos\/(\d+)/)?.[1];
      if (videoId) {
        return { embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1`, provider: 'facebook' };
      }
    }

    if (host === 'vevo.com' || host === 'www.vevo.com') {
      const id = u.pathname.match(/\/watch\/([^/]+)/)?.[1];
      if (id) {
        return { embedUrl: `https://www.vevo.com/embed/${id}?autoplay=true`, provider: 'vevo' };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getProviderLabel(provider: VideoProvider): string {
  const labels: Record<VideoProvider, string> = {
    youtube: 'YouTube',
    dailymotion: 'Dailymotion',
    vimeo: 'Vimeo',
    twitch: 'Twitch',
    facebook: 'Facebook',
    vevo: 'Vevo',
    other: 'Other',
  };
  return labels[provider];
}

export function getProviderColor(provider: VideoProvider): string {
  const colors: Record<VideoProvider, string> = {
    youtube: 'bg-red-600',
    dailymotion: 'bg-blue-600',
    vimeo: 'bg-blue-500',
    twitch: 'bg-purple-600',
    facebook: 'bg-blue-800',
    vevo: 'bg-black',
    other: 'bg-gray-600',
  };
  return colors[provider];
}