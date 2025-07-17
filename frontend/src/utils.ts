export function getApiUrl(path: string) {
  const base = import.meta.env.VITE_API_URL || '';
  // Remove trailing slash from base and leading slash from path
  return base.replace(/\/$/, '') + path;
} 