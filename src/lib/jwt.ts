/** Decode a JWT payload client-side (no signature check — the backend already
 * verified it; this just reads the claims for display / expiry scheduling). */
export function decodeJwt<T>(token: string): T {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Malformed token');
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
  return JSON.parse(json) as T;
}
