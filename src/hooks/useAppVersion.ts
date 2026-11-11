import { useEffect, useState } from 'react';
import { apiGetMeta } from '@/lib/apiClient';

// Module-scoped so every consumer (Sidebar, AppShell footer, LoginPage) shares one
// /api/meta fetch per page load instead of each mounting its own request.
let cachedVersion: string | null = null;
let inflight: Promise<string> | null = null;

/** Live app version from /api/meta, which mirrors backend/VERSION (SSOT — see
 * app/main.py::meta and app/core/config.py::_read_version). Returns null until
 * the first fetch resolves; callers should render a fallback until then. */
export function useAppVersion(): string | null {
  const [version, setVersion] = useState<string | null>(cachedVersion);

  useEffect(() => {
    if (cachedVersion) return;
    if (!inflight) {
      inflight = apiGetMeta()
        .then((meta) => {
          cachedVersion = meta.version;
          return cachedVersion;
        })
        .catch(() => {
          inflight = null; // allow a later mount to retry
          return '';
        });
    }
    let cancelled = false;
    inflight.then((v) => {
      if (!cancelled && v) setVersion(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return version;
}
