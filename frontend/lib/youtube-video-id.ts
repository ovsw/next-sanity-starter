const youtubeHosts = [
  "youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
] as const;

const youtubePathPrefixes = new Set(["embed", "live", "shorts", "v"]);
const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeVideoId(value?: string | null): value is string {
  return !!value && youtubeVideoIdPattern.test(value);
}

export function getYouTubeVideoId(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (
      url.protocol !== "https:" ||
      !youtubeHosts.includes(hostname as (typeof youtubeHosts)[number])
    ) {
      return null;
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = pathSegments.length === 1 ? pathSegments[0] : null;
    } else if (youtubePathPrefixes.has(pathSegments[0] ?? "")) {
      videoId = pathSegments.length === 2 ? pathSegments[1] : null;
    } else {
      videoId = url.searchParams.get("v");
    }

    return videoId && youtubeVideoIdPattern.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}
