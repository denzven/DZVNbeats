/**
 * URL and Download Helpers for DZVNbeats
 * Handles base paths (e.g. GitHub Pages repo path or custom domains),
 * canonical share URLs, and direct file downloads without navigating away.
 */

const PRODUCTION_ORIGIN = "https://denzven.github.io";
const REPO_NAME = "DZVNbeats";

/**
 * Returns the base path for assets and routing.
 * Ensures "/DZVNbeats/" is used on GitHub Pages or any sub-path deployment,
 * while cleanly falling back to "/" on root domains or local dev.
 */
export const getSiteBasePath = (): string => {
  if (typeof window === "undefined") {
    return `/${REPO_NAME}/`;
  }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // GitHub Pages domain (denzven.github.io) or URL already containing /DZVNbeats
  if (
    hostname.endsWith("github.io") ||
    pathname.toLowerCase().includes(`/${REPO_NAME.toLowerCase()}`)
  ) {
    return `/${REPO_NAME}/`;
  }

  // If Vite's base is an explicit absolute path
  const base = import.meta.env.BASE_URL;
  if (base && !base.startsWith(".")) {
    return base.endsWith("/") ? base : `${base}/`;
  }

  return "/";
};

/**
 * Returns the site origin + base path (e.g. "https://denzven.github.io/DZVNbeats/").
 */
export const getSiteRootUrl = (): string => {
  if (typeof window === "undefined") {
    return `${PRODUCTION_ORIGIN}/${REPO_NAME}/`;
  }
  const origin = window.location.origin;
  const base = getSiteBasePath();
  return `${origin}${base}`;
};

/**
 * Resolves a relative path against the app's base path.
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
  const base = getSiteBasePath();
  return `${base}${clean}`;
};

/**
 * Returns an absolute URL (with protocol and domain) for Open Graph, SEO, and social shares.
 * Example: https://denzven.github.io/DZVNbeats/covers/akbaar-cover.jpg
 */
export const getAbsoluteUrl = (path?: string): string => {
  if (!path) return getSiteRootUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const clean = path.replace(/^\.\//, "").replace(/^\//, "");
  return `${getSiteRootUrl()}${clean}`;
};

/**
 * Generates the rich social card share link for a specific beat.
 * Points to the pre-rendered SEO page (https://denzven.github.io/DZVNbeats/beat/<beatId>/)
 * which carries full Open Graph/Twitter meta tags and automatically redirects human visitors to autoplay.
 */
export const getBeatShareUrl = (beatId: string): string => {
  return `${getSiteRootUrl()}beat/${encodeURIComponent(beatId)}/`;
};

/**
 * Generates a direct HashRouter URL (https://denzven.github.io/DZVNbeats/#/beats?play=<beatId>)
 */
export const getDirectBeatUrl = (beatId: string): string => {
  return `${getSiteRootUrl()}#/beats?play=${encodeURIComponent(beatId)}`;
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
