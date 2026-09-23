/**
 * URL and Download Helpers for DZVNbeats
 * Handles base paths (e.g. GitHub Pages repo path or custom domains),
 * canonical share URLs, and direct file downloads without navigating away.
 */

const PRODUCTION_ORIGIN = "https://denzven.github.io";
const PRODUCTION_BASE = "/DZVNbeats/";

/**
 * Resolves a relative path against Vite's BASE_URL.
 * Ensures compatibility across local dev ('/') and GitHub Pages ('/DZVNbeats/').
 */
export const resolveUrl = (path?: string): string => {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const clean = path.replace(/^\.\//, "").replace(/^\//, "");
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
};

/**
 * Returns an absolute URL (with protocol and domain) for Open Graph, SEO, and social shares.
 */
export const getAbsoluteUrl = (path?: string): string => {
  if (!path) return `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const clean = path.replace(/^\.\//, "").replace(/^\//, "");
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : PRODUCTION_ORIGIN;
  const base = import.meta.env.BASE_URL || "/";
  const pathWithBase = base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;

  return `${origin}${pathWithBase.startsWith("/") ? pathWithBase : `/${pathWithBase}`}`;
};

/**
 * Generates the canonical share link for a specific beat.
 * Points to the pre-rendered SEO page (/beat/<beatId>/) which carries
 * full Open Graph/Twitter meta tags and automatically redirects human visitors to autoplay.
 */
export const getBeatShareUrl = (beatId: string): string => {
  if (typeof window === "undefined") {
    return `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}beat/${encodeURIComponent(beatId)}/`;
  }

  const origin = window.location.origin;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${origin}${base}/beat/${encodeURIComponent(beatId)}/`;
};

/**
 * Triggers a direct, non-navigating file download by fetching the target as a Blob.
 * Prevents mobile and desktop browsers from redirecting to a standalone media player tab.
 */
export const triggerDirectDownload = async (
  url: string,
  filename: string,
  onProgress?: (isDownloading: boolean) => void,
): Promise<boolean> => {
  const resolved = resolveUrl(url);

  if (onProgress) onProgress(true);

  try {
    const response = await fetch(resolved);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "DZVNbeats_track.wav";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke object URL after trigger
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    if (onProgress) onProgress(false);
    return true;
  } catch (error) {
    console.warn("Direct blob download failed, falling back to standard anchor trigger:", error);

    // Fallback: standard anchor click with download attribute
    const link = document.createElement("a");
    link.href = resolved;
    link.download = filename || "DZVNbeats_track.wav";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onProgress) onProgress(false);
    return false;
  }
};
