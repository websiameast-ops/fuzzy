export function getAssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${cleanPath}`;
}
