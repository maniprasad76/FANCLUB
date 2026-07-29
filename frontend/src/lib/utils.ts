export const formatImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  let baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  if (baseUrl.includes('localhost') && typeof window !== 'undefined') {
    baseUrl = baseUrl.replace('localhost', window.location.hostname);
  }
  return url.startsWith('/') ? baseUrl + url : baseUrl + '/' + url;
};
