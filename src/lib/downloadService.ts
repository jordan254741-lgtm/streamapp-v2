import { searchFullMovie, searchAllDailymotion } from '@/lib/dailymotion';
import { searchInternetArchive } from '@/lib/internetarchive';
import type { QualityOption } from '@/types';

export type FileKind = 'mp4' | 'hls';

export interface ResolvedFile {
  kind: FileKind;
  url: string;
  provider: string;
}

const QUALITY_TARGET: Record<QualityOption, number> = {
  '480p': 480,
  '720p': 720,
  '1080p': 1080,
};

interface DmQualityEntry {
  label: string | number;
  type: string;
  urls: string[];
}

interface DmMetadata {
  qualities?: DmQualityEntry[];
  error?: { reason?: string };
}

export const sanitizeFilename = (title: string): string =>
  title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'video';

export const buildFilename = (title: string, quality: QualityOption, kind: FileKind): string =>
  `${sanitizeFilename(title)} (${quality}).${kind === 'hls' ? 'ts' : 'mp4'}`;

// ---------------------------------------------------------------------------
// Source resolution
// ---------------------------------------------------------------------------

const pickDmQuality = (qualities: DmQualityEntry[], target: number): DmQualityEntry | null => {
  const usable = qualities.filter((q) => q.urls?.length);
  if (usable.length === 0) return null;

  const mp4Entries = usable.filter((q) => q.type.includes('mp4'));
  const pool = mp4Entries.length > 0 ? mp4Entries : usable;

  const labeled = pool
    .map((q) => ({ entry: q, height: typeof q.label === 'number' ? q.label : parseInt(String(q.label), 10) || 0 }))
    .filter((q) => q.height > 0)
    .sort((a, b) => b.height - a.height);

  if (labeled.length === 0) return pool[0];

  const atOrBelow = labeled.find((q) => q.height <= target);
  return (atOrBelow ?? labeled[labeled.length - 1]).entry;
};

export const getDailymotionStreamInfo = async (
  videoId: string,
  quality: QualityOption,
): Promise<ResolvedFile> => {
  const response = await fetch(`https://www.dailymotion.com/player/metadata/video/${videoId}`);
  if (!response.ok) throw new Error(`Dailymotion metadata unavailable (${response.status})`);

  const meta = (await response.json()) as DmMetadata;
  if (meta.error || !meta.qualities?.length) throw new Error('No stream qualities returned');

  const chosen = pickDmQuality(meta.qualities, QUALITY_TARGET[quality]);
  if (!chosen) throw new Error('No downloadable stream found');

  const url = chosen.urls[0];
  return {
    kind: chosen.type.includes('mpegURL') || url.includes('.m3u8') ? 'hls' : 'mp4',
    url,
    provider: 'dailymotion',
  };
};

interface ArchiveFile {
  name: string;
  format?: string;
  size?: string;
}

interface ArchiveMetadataResponse {
  files?: ArchiveFile[];
}

const VIDEO_FORMAT_PRIORITY = ['MPEG4', 'h.264', '512Kb MPEG4', 'HiRes MPEG4', 'Matroska', 'Ogg Video', 'MPEG2'];

export const getArchiveFileInfo = async (identifier: string): Promise<ResolvedFile> => {
  const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  if (!response.ok) throw new Error(`Archive metadata unavailable (${response.status})`);

  const meta = (await response.json()) as ArchiveMetadataResponse;
  const files = (meta.files ?? []).filter((f) => /\.(mp4|m4v|mkv|avi|ogv|mpg|mpeg)$/i.test(f.name));
  if (files.length === 0) throw new Error('No video files in this archive item');

  let best = files[0];
  let bestScore = -1;
  for (const file of files) {
    const formatIdx = VIDEO_FORMAT_PRIORITY.indexOf(file.format ?? '');
    const score = (formatIdx >= 0 ? 100 - formatIdx : 0) + (parseInt(file.size ?? '0', 10) / 1e9);
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }

  const ext = best.name.split('.').pop()?.toLowerCase();
  return {
    kind: ext === 'mp4' || ext === 'm4v' ? 'mp4' : 'mp4',
    url: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(best.name)}`,
    provider: 'archive',
  };
};

export const resolveMovieFile = async ({
  title,
  year,
  quality,
}: {
  title: string;
  year?: number;
  quality: QualityOption;
}): Promise<ResolvedFile> => {
  const candidates: Array<{ provider: string; id: string }> = [];

  try {
    const full = await searchFullMovie(title, year);
    if (full) candidates.push({ provider: 'dailymotion', id: full.id });
  } catch {
    // ignore
  }

  if (candidates.length === 0) {
    try {
      const all = await searchAllDailymotion(title, year);
      const sorted = [...all].sort((a, b) => {
        const aFull = a.duration >= 45 * 60 ? 1 : 0;
        const bFull = b.duration >= 45 * 60 ? 1 : 0;
        if (aFull !== bFull) return bFull - aFull;
        return b.duration - a.duration;
      });
      for (const video of sorted.slice(0, 4)) {
        candidates.push({ provider: 'dailymotion', id: video.id });
      }
    } catch {
      // ignore
    }
  }

  try {
    const archiveResults = await searchInternetArchive(title, year);
    for (const item of archiveResults.slice(0, 2)) {
      const identifier = item.id.replace(/^archive-/, '');
      if (identifier) candidates.push({ provider: 'archive', id: identifier });
    }
  } catch {
    // ignore
  }

  const errors: string[] = [];
  for (const candidate of candidates.slice(0, 6)) {
    try {
      if (candidate.provider === 'dailymotion') {
        return await getDailymotionStreamInfo(candidate.id, quality);
      }
      return await getArchiveFileInfo(candidate.id);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    errors.length > 0
      ? `Could not resolve a downloadable source. ${errors[0]}`
      : 'No downloadable source found for this title.',
  );
};

// ---------------------------------------------------------------------------
// File saving (File System Access API with blob fallback)
// ---------------------------------------------------------------------------

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: BufferSource | Blob | string) => Promise<void>;
      close: () => Promise<void>;
      abort?: () => Promise<void>;
    }>;
  }>;
}

const extensionFor = (kind: FileKind, url: string): string => {
  if (kind === 'hls') return 'ts';
  const match = url.split('?')[0].match(/\.(\w{2,4})$/);
  const ext = match?.[1]?.toLowerCase();
  return ext && ['mp4', 'm4v', 'mkv', 'webm'].includes(ext) ? ext : 'mp4';
};

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

export interface DownloadHooks {
  signal: AbortSignal;
  onProgress: (receivedBytes: number, totalBytes: number) => void;
  onStage?: (stage: 'connecting' | 'downloading') => void;
}

export const downloadAndSave = async (
  resolved: ResolvedFile,
  baseTitle: string,
  quality: QualityOption,
  hooks: DownloadHooks,
): Promise<{ filename: string }> => {
  const filename =
    resolved.kind === 'hls'
      ? `${sanitizeFilename(baseTitle)} (${quality}).${extensionFor(resolved.kind, resolved.url)}`
      : `${sanitizeFilename(baseTitle)} (${quality}).${extensionFor(resolved.kind, resolved.url)}`;

  if (resolved.kind === 'hls') {
    const blob = await downloadHlsToBlob(resolved.url, hooks);
    await saveBlob(blob, filename);
    return { filename };
  }

  return downloadProgressive(resolved.url, filename, hooks);
};

const downloadProgressive = async (
  url: string,
  filename: string,
  hooks: DownloadHooks,
): Promise<{ filename: string }> => {
  const { signal, onProgress, onStage } = hooks;
  onStage?.('connecting');

  const response = await fetch(url, { signal, mode: 'cors' });
  if (!response.ok) throw new Error(`Server responded ${response.status}`);

  const totalBytes = Number(response.headers.get('content-length') ?? 0);
  const win = window as SaveFilePickerWindow;

  if (response.body && win.showSaveFilePicker) {
    let handle;
    try {
      handle = await win.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Video', accept: { 'video/mp4': [`.${extensionFor('mp4', url)}`] } }],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      handle = null;
    }

    if (handle) {
      const writable = await handle.createWritable();
      const reader = response.body.getReader();
      let received = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          await writable.write(value);
          received += value.byteLength;
          onStage?.('downloading');
          onProgress(received, totalBytes);
        }
        await writable.close();
      } catch (err) {
        try {
          await writable.abort?.();
        } catch {
          // ignore
        }
        throw err;
      }
      return { filename };
    }
  }

  // Fallback: buffer in memory, then hand to the browser's download manager
  const chunks: Uint8Array[] = [];
  let received = 0;
  if (response.body) {
    const reader = response.body.getReader();
    onStage?.('downloading');
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      onProgress(received, totalBytes);
    }
  } else {
    const buffer = await response.arrayBuffer();
    chunks.push(new Uint8Array(buffer));
    received = buffer.byteLength;
    onProgress(received, received);
  }

  const mime = response.headers.get('content-type')?.startsWith('video/') ? response.headers.get('content-type')! : 'video/mp4';
  triggerBrowserDownload(new Blob(chunks as BlobPart[], { type: mime }), filename);
  return { filename };
};

// ---------------------------------------------------------------------------
// HLS (m3u8) support: concatenate MPEG-TS segments into a single .ts file
// ---------------------------------------------------------------------------

const parseM3u8 = async (manifestUrl: string, targetHeight: number, signal: AbortSignal): Promise<string[]> => {
  const response = await fetch(manifestUrl, { signal, mode: 'cors' });
  if (!response.ok) throw new Error(`Playlist unavailable (${response.status})`);
  const text = await response.text();

  const lines = text.split('\n').map((line) => line.trim());
  const absolute = (value: string) => new URL(value, manifestUrl).href;

  const streamInfLines = lines.filter((l) => l.startsWith('#EXT-X-STREAM-INF'));
  if (streamInfLines.length > 0) {
    const variants: Array<{ url: string; height: number; bandwidth: number }> = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXT-X-STREAM-INF')) continue;
      const attrs = lines[i];
      const nextLine = lines[i + 1];
      if (!nextLine || nextLine.startsWith('#')) continue;

      const resMatch = attrs.match(/RESOLUTION=(\d+)x(\d+)/);
      const bwMatch = attrs.match(/BANDWIDTH=(\d+)/);
      variants.push({
        url: absolute(nextLine),
        height: resMatch ? parseInt(resMatch[2], 10) : 0,
        bandwidth: bwMatch ? parseInt(bwMatch[1], 10) : 0,
      });
    }
    if (variants.length === 0) throw new Error('Malformed HLS playlist');

    variants.sort((a, b) => b.height - a.height);
    const chosen = variants.find((v) => v.height <= targetHeight) ?? variants[variants.length - 1];
    if (chosen.url !== manifestUrl) {
      return parseM3u8(chosen.url, targetHeight, signal);
    }
  }

  const encrypted = lines.some((l) => l.startsWith('#EXT-X-KEY') && !l.includes('METHOD=NONE'));
  if (encrypted) throw new Error('Stream is DRM/encrypted and cannot be saved');

  const segments = lines.filter((l) => l.length > 0 && !l.startsWith('#')).map(absolute);
  if (segments.length === 0) throw new Error('Playlist contains no media segments');
  return segments;
};

const downloadHlsToBlob = async (manifestUrl: string, hooks: DownloadHooks): Promise<Blob> => {
  const { signal, onProgress, onStage } = hooks;
  onStage?.('connecting');
  const targetHeight = QUALITY_TARGET[(hooks as DownloadHooks & { quality?: QualityOption }).quality ?? '720p'];

  const segments = await parseM3u8(manifestUrl, Number.isNaN(targetHeight) ? 720 : targetHeight, signal);

  const chunks: ArrayBuffer[] = [];
  let received = 0;
  onStage?.('downloading');

  for (let i = 0; i < segments.length; i++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const segResponse = await fetch(segments[i], { signal, mode: 'cors' });
    if (!segResponse.ok) throw new Error(`Segment ${i + 1}/${segments.length} failed (${segResponse.status})`);
    const buffer = await segResponse.arrayBuffer();
    chunks.push(buffer);
    received += buffer.byteLength;
    onProgress(received, 0);
  }

  return new Blob(chunks, { type: 'video/mp2t' });
};

const saveBlob = async (blob: Blob, filename: string) => {
  const win = window as SaveFilePickerWindow;
  if (win.showSaveFilePicker) {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Video', accept: { 'video/mp2t': ['.ts'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      // fall through to browser download
    }
  }
  triggerBrowserDownload(blob, filename);
};
