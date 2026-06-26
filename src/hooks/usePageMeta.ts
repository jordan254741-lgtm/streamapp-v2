import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
}

export const usePageMeta = ({ title, description }: PageMeta) => {
  useEffect(() => {
    document.title = `${title} | StreamApp`;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
  }, [title, description]);
};
