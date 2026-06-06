export const formatImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  let baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://fanclub-backend.onrender.com';
  if (baseUrl.includes('localhost') && typeof window !== 'undefined') {
    baseUrl = baseUrl.replace('localhost', window.location.hostname);
  }
  return url.startsWith('/') ? baseUrl + url : baseUrl + '/' + url;
};
