export const API_BASE_URL = '';

export function buildApiUrl(path) {
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const route = path.replace(/^\/+/, '');
  return baseUrl ? `${baseUrl}/${route}` : `/${route}`;
}