/** Resolves an admin-configured landing-page video URL (see apiGetLandingVideo)
 * into something the video modal can render. YouTube/Vimeo links become an
 * iframe embed; anything else is treated as a direct file link (mp4/webm/...)
 * and played with a plain <video> tag. */
export interface VideoEmbed {
  kind: 'youtube' | 'vimeo' | 'file';
  embedSrc: string;
}

const YOUTUBE_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

export function resolveVideoEmbed(url: string): VideoEmbed {
  const youtube = url.match(YOUTUBE_RE);
  if (youtube) {
    return { kind: 'youtube', embedSrc: `https://www.youtube.com/embed/${youtube[1]}` };
  }
  const vimeo = url.match(VIMEO_RE);
  if (vimeo) {
    return { kind: 'vimeo', embedSrc: `https://player.vimeo.com/video/${vimeo[1]}` };
  }
  return { kind: 'file', embedSrc: url };
}
