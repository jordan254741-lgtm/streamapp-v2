import React, { useState } from 'react';
import { useSubmitCommunityVideo } from '@/hooks/useCommunityVideos';
import { getEmbedInfo, getProviderLabel } from '@/lib/embed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SubmitVideoDialogProps {
  defaultTitle?: string;
  defaultTmdbId?: number;
}

const SubmitVideoDialog: React.FC<SubmitVideoDialogProps> = ({ defaultTitle, defaultTmdbId }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [url, setUrl] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('en');
  const [embedPreview, setEmbedPreview] = useState<string | null>(null);
  const [embedProvider, setEmbedProvider] = useState<string | null>(null);

  const mutation = useSubmitCommunityVideo();

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const info = getEmbedInfo(value);
    if (info) {
      setEmbedPreview(info.embedUrl);
      setEmbedProvider(getProviderLabel(info.provider));
    } else {
      setEmbedPreview(null);
      setEmbedProvider(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        title,
        url,
        year: year ? parseInt(year, 10) : null,
        language,
        tmdb_id: defaultTmdbId ?? null,
        poster_url: null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setUrl('');
          setYear('');
          setLanguage('en');
          setEmbedPreview(null);
          setEmbedProvider(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Submit Video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl bg-[#0a0a0a] border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="text-lg">Submit a Community Video</DialogTitle>
          <DialogDescription className="text-neutral-500">
            Share a video link from YouTube, Dailymotion, Vimeo, Twitch, or Facebook.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cv-title" className="text-neutral-400 mb-1.5 block">Movie Title *</Label>
            <Input
              id="cv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Inception"
            />
          </div>
          <div>
            <Label htmlFor="cv-url" className="text-neutral-400 mb-1.5 block">Video URL *</Label>
            <Input
              id="cv-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              required
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {embedPreview && embedProvider && (
              <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {embedProvider} embed detected
              </p>
            )}
            {url && !embedPreview && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Unsupported platform
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cv-year" className="text-neutral-400 mb-1.5 block">Year</Label>
              <Input
                id="cv-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min={1888}
                max={2030}
              />
            </div>
            <div>
              <Label htmlFor="cv-language" className="text-neutral-400 mb-1.5 block">Language</Label>
              <select
                id="cv-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 outline-none focus:border-white/20"
              >
                <option value="en" className="bg-black">English</option>
                <option value="sw" className="bg-black">Swahili</option>
                <option value="fr" className="bg-black">French</option>
                <option value="es" className="bg-black">Spanish</option>
                <option value="ar" className="bg-black">Arabic</option>
                <option value="hi" className="bg-black">Hindi</option>
                <option value="other" className="bg-black">Other</option>
              </select>
            </div>
          </div>
          {mutation.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm">{mutation.error.message}</p>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !embedPreview}
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitVideoDialog;
