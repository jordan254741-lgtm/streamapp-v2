import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const BASE_URL = 'https://streamapp.example.com';

export const usePageMeta = ({
  title,
  description,
  image,
  url,
  type = 'website',
}: PageMeta) => {
  useEffect(() => {
    const fullTitle = `${title} | StreamApp`;
    document.title = fullTitle;

    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const updateProperty = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    if (description) {
      updateMeta('description', description);
    }
    updateMeta('theme-color', '#09090b');

    updateProperty('og:title', fullTitle);
    updateProperty('og:description', description || 'StreamApp - Watch movies and TV shows');
    updateProperty('og:type', type);
    updateProperty('og:url', url || BASE_URL);
    if (image) {
      updateProperty('og:image', image);
    }

    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description || 'StreamApp - Watch movies and TV shows');
    if (image) {
      updateMeta('twitter:image', image);
    }

    return () => {
      document.title = 'StreamApp';
    };
  }, [title, description, image, url, type]);
};
