interface VideoProcessingOptions {
  videoId: string;
  file: File;
  title: string;
  quality?: '480p' | '720p' | '1080p' | '4K';
  onProgress?: (progress: number) => void;
}

interface ProcessedVideo {
  id: string;
  originalId?: string;
  title: string;
  originalFile: string;
  processedFile: string;
  thumbnail: string;
  duration: number;
  size: number;
  quality: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

class VideoProcessor {
  private processingQueue: string[] = [];
  private processingActive = false;

  async initialize(): Promise<void> {
    // WebCodecs API or cloud processing would be used here
    // Currently using a placeholder implementation
  }

  async processVideo(options: VideoProcessingOptions): Promise<ProcessedVideo> {
    const processedVideo: ProcessedVideo = {
      id: crypto.randomUUID(),
      title: options.title,
      originalFile: options.file.name,
      processedFile: '',
      thumbnail: '',
      duration: 0,
      size: options.file.size,
      quality: options.quality || '720p',
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    try {
      // Generate a mock thumbnail from the video file
      const thumbnailUrl = await this.generateThumbnail(options.file);
      processedVideo.thumbnail = thumbnailUrl;
      processedVideo.duration = await this.getVideoDuration(options.file);
      processedVideo.processedFile = options.file.name;
      processedVideo.status = 'completed';
      processedVideo.completedAt = new Date().toISOString();
    } catch (error) {
      processedVideo.status = 'failed';
      processedVideo.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return processedVideo;
  }

  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadeddata = () => {
        video.currentTime = Math.min(10, video.duration / 2);
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(video, 0, 0, 320, 180);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
      video.src = URL.createObjectURL(file);
    });
  }

  async addToQueue(videoId: string): Promise<void> {
    if (!this.processingQueue.includes(videoId)) {
      this.processingQueue.push(videoId);
    }
    if (!this.processingActive) {
      this.processingActive = true;
      this.processNextInQueue();
    }
  }

  private async processNextInQueue(): Promise<void> {
    if (this.processingQueue.length === 0) {
      this.processingActive = false;
      return;
    }

    const videoId = this.processingQueue.shift();
    if (!videoId) {
      this.processingActive = false;
      return;
    }

    try {
      await this.updateVideoStatus(videoId, 'completed');
    } catch {
      await this.updateVideoStatus(videoId, 'failed');
    }

    setTimeout(() => this.processNextInQueue(), 1000);
  }

  private async updateVideoStatus(videoId: string, status: ProcessedVideo['status'], error?: string): Promise<void> {
    const response = await fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, error }),
    });
    if (!response.ok) {
      console.error('Failed to update video status');
    }
  }
}

export { VideoProcessor };
export type { VideoProcessingOptions, ProcessedVideo };
