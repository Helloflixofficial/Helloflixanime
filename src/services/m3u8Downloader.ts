import { M3U8_PROXIES, PROXY_TIMEOUT_MS } from "@/config/api";

type StreamHeaders = Record<string, string>;

interface DownloadM3u8Options {
  streamUrl: string;
  headers?: StreamHeaders;
  filename?: string;
  onProgress?: (progress: number, status: string) => void;
}

const sanitizeFilename = (name: string) =>
  name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

const buildProxyUrl = (proxy: string, targetUrl: string, headers?: StreamHeaders) => {
  const encodedUrl = encodeURIComponent(targetUrl);
  if (!headers || Object.keys(headers).length === 0) {
    return `${proxy}${encodedUrl}`;
  }
  return `${proxy}${encodedUrl}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
};

const findWorkingProxy = async (streamUrl: string, headers?: StreamHeaders) => {
  for (const proxy of M3U8_PROXIES) {
    const url = buildProxyUrl(proxy, streamUrl, headers);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
      const res = await fetch(url, {
        method: "HEAD",
        mode: "cors",
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok || res.status === 200 || res.type === "opaque") return proxy;
    } catch {
      // try next proxy
    }
  }
  return M3U8_PROXIES[0];
};

const toAbsoluteUrl = (url: string, baseUrl: string) => {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
};

const fetchText = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed request (${res.status})`);
  }
  return res.text();
};

const fetchBuffer = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed request (${res.status})`);
  }
  return res.arrayBuffer();
};

const pickBestVariant = (manifest: string) => {
  const lines = manifest.split("\n").map((line) => line.trim());
  const variants: { bandwidth: number; uri: string }[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].startsWith("#EXT-X-STREAM-INF")) continue;
    const bandwidthMatch = lines[i].match(/BANDWIDTH=(\d+)/i);
    const bandwidth = bandwidthMatch ? Number(bandwidthMatch[1]) : 0;
    let nextUri = "";
    for (let j = i + 1; j < lines.length; j += 1) {
      if (!lines[j]) continue;
      if (lines[j].startsWith("#")) continue;
      nextUri = lines[j];
      break;
    }
    if (nextUri) variants.push({ bandwidth, uri: nextUri });
  }

  if (variants.length === 0) return null;
  variants.sort((a, b) => b.bandwidth - a.bandwidth);
  return variants[0].uri;
};

const parseMediaManifest = (manifest: string) => {
  const lines = manifest.split("\n").map((line) => line.trim());
  const segments: string[] = [];
  let initSegment = "";

  for (const line of lines) {
    if (!line) continue;

    if (line.startsWith("#EXT-X-KEY")) {
      throw new Error("This stream is encrypted and cannot be directly exported as a file.");
    }

    if (line.startsWith("#EXT-X-MAP")) {
      const mapMatch = line.match(/URI="([^"]+)"/i);
      if (mapMatch?.[1]) initSegment = mapMatch[1];
      continue;
    }

    if (line.startsWith("#")) continue;
    segments.push(line);
  }

  if (segments.length === 0) {
    throw new Error("No video segments found in playlist.");
  }

  return { initSegment, segments };
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const downloadM3u8AsTs = async ({
  streamUrl,
  headers,
  filename,
  onProgress,
}: DownloadM3u8Options) => {
  onProgress?.(2, "Checking fastest download server...");
  const proxy = await findWorkingProxy(streamUrl, headers);

  onProgress?.(8, "Loading playlist...");
  const masterManifest = await fetchText(buildProxyUrl(proxy, streamUrl, headers));

  const variantUri = pickBestVariant(masterManifest);
  const mediaManifestUrl = variantUri ? toAbsoluteUrl(variantUri, streamUrl) : streamUrl;

  const mediaManifest =
    mediaManifestUrl === streamUrl
      ? masterManifest
      : await fetchText(buildProxyUrl(proxy, mediaManifestUrl, headers));

  const { initSegment, segments } = parseMediaManifest(mediaManifest);
  const segmentUrls = [
    ...(initSegment ? [toAbsoluteUrl(initSegment, mediaManifestUrl)] : []),
    ...segments.map((segment) => toAbsoluteUrl(segment, mediaManifestUrl)),
  ];

  const buffers: ArrayBuffer[] = [];
  for (let i = 0; i < segmentUrls.length; i += 1) {
    const segmentUrl = segmentUrls[i];
    const buffer = await fetchBuffer(buildProxyUrl(proxy, segmentUrl, headers));
    buffers.push(buffer);

    const progress = Math.round(10 + ((i + 1) / segmentUrls.length) * 88);
    onProgress?.(progress, `Downloading chunk ${i + 1} of ${segmentUrls.length}...`);
  }

  const safeName = sanitizeFilename(filename || `episode-${Date.now()}`);
  const outputName = `${safeName}.ts`;
  const blob = new Blob(buffers, { type: "video/mp2t" });
  triggerDownload(blob, outputName);
  onProgress?.(100, "Download ready.");

  return outputName;
};
