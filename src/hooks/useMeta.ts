import { useEffect } from 'react';

interface MetaTags {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const BASE_URL = 'https://streamapp.example.com';

export function useMetaTags(meta: MetaTags): void {
  useEffect(() => {
    document.title = meta.title;

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

    updateMeta('description', meta.description || 'StreamApp - Watch movies and TV shows');
    updateMeta('theme-color', '#09090b');

    updateProperty('og:title', meta.title);
    updateProperty('og:description', meta.description || 'StreamApp - Watch movies and TV shows');
    updateProperty('og:type', meta.type || 'website');
    updateProperty('og:url', meta.url || BASE_URL);
    if (meta.image) {
      updateProperty('og:image', meta.image);
    }

    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', meta.title);
    updateMeta('twitter:description', meta.description || 'StreamApp - Watch movies and TV shows');
    if (meta.image) {
      updateMeta('twitter:image', meta.image);
    }

    return () => {
      document.title = 'StreamApp';
    };
  }, [meta.title, meta.description, meta.image, meta.url, meta.type]);
}
