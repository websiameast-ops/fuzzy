/** Stable per-browser device id for the backend's se_connex.UserSession
 * single-device login policy — the same browser logging in again reuses its
 * slot instead of being treated as a competing device. */
const DEVICE_ID_KEY = 'se_device_id';

/** `crypto.randomUUID()` only exists in secure contexts (HTTPS or
 * http://localhost) — on a plain-HTTP LAN origin (e.g. http://192.168.x.x:5173,
 * for testing from another device on the same network) it's `undefined` and
 * throws before login ever reaches the network, surfacing as a misleading
 * "Email or password is incorrect." `crypto.getRandomValues()` has no such
 * restriction, so build a UUID v4 from that instead; fall back to Math.random
 * only if the Crypto API itself is unavailable. */
function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(16))
      : Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
