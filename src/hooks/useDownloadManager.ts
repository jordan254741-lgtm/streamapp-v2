import { useSyncExternalStore } from 'react';
import type { QualityOption } from '@/types';

export type DownloadTaskStatus = 'resolving' | 'connecting' | 'downloading' | 'saving' | 'done' | 'error' | 'cancelled';

export interface DownloadTask {
  id: string;
  title: string;
  quality: QualityOption;
  status: DownloadTaskStatus;
  receivedBytes: number;
  totalBytes: number;
  error?: string;
  startedAt: number;
}

interface TaskMeta {
  title: string;
  quality: QualityOption;
}

class DownloadManagerStore {
  private tasks = new Map<string, DownloadTask>();
  private controllers = new Map<string, AbortController>();
  private listeners = new Set<() => void>();
  private snapshot: DownloadTask[] = [];

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): DownloadTask[] => this.snapshot;

  private notify() {
    this.snapshot = [...this.tasks.values()].sort((a, b) => b.startedAt - a.startedAt);
    this.listeners.forEach((listener) => listener());
  }

  begin(meta: TaskMeta): string {
    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const controller = new AbortController();
    this.controllers.set(id, controller);
    this.tasks.set(id, {
      id,
      title: meta.title,
      quality: meta.quality,
      status: 'resolving',
      receivedBytes: 0,
      totalBytes: 0,
      startedAt: Date.now(),
    });
    this.notify();
    return id;
  }

  getController(id: string): AbortController | undefined {
    return this.controllers.get(id);
  }

  setStatus(id: string, status: DownloadTaskStatus) {
    const task = this.tasks.get(id);
    if (!task || task.status === status) return;
    task.status = status;
    if (status === 'done' || status === 'error' || status === 'cancelled') {
      setTimeout(() => {
        this.controllers.get(id)?.abort();
        this.controllers.delete(id);
        if (status !== 'error') {
          this.tasks.delete(id);
          this.notify();
        }
      }, status === 'done' ? 2500 : 8000);
    }
    this.notify();
  }

  setProgress(id: string, receivedBytes: number, totalBytes: number) {
    const task = this.tasks.get(id);
    if (!task) return;
    task.receivedBytes = receivedBytes;
    task.totalBytes = totalBytes;
    if (task.status === 'connecting' || task.status === 'resolving') task.status = 'downloading';
    this.notify();
  }

  fail(id: string, message: string) {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = 'error';
    task.error = message;
    this.controllers.delete(id);
    this.notify();
    setTimeout(() => {
      this.tasks.delete(id);
      this.notify();
    }, 10_000);
  }

  cancel(id: string) {
    this.controllers.get(id)?.abort();
    this.controllers.delete(id);
    const task = this.tasks.get(id);
    if (!task) return;
    if (task.status === 'done' || task.status === 'error') return;
    this.tasks.delete(id);
    this.notify();
  }

  isRunning(title: string, quality: QualityOption): boolean {
    return [...this.tasks.values()].some(
      (t) =>
        t.title === title &&
        t.quality === quality &&
        t.status !== 'done' &&
        t.status !== 'error' &&
        t.status !== 'cancelled',
    );
  }
}

export const downloadManager = new DownloadManagerStore();

export const useActiveDownloads = (): DownloadTask[] => {
  return useSyncExternalStore(downloadManager.subscribe, downloadManager.getSnapshot, downloadManager.getSnapshot);
};
