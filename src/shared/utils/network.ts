export function resolveNetworkUrl(url: string | undefined): string {
  if (!url) return "";

  if (typeof window === "undefined") return url;

  const hostname = window.location.hostname;

  const localDirectusUrl = import.meta.env.VITE_DIRECTUS_URL;
  const externalDirectusUrl = import.meta.env.VITE_DIRECTUS_URL_EXTERNAL;
  const localWebhookUrl = import.meta.env.VITE_WEBHOOK_URL_TRASLADOS;
  const externalWebhookHost = import.meta.env.VITE_WEBHOOK_HOST_EXTERNAL;

  if (!localDirectusUrl || !externalDirectusUrl || !localWebhookUrl || !externalWebhookHost) {
    return url;
  }

  let localSubnet = "";
  let localHostAndPort = "";
  let externalHostAndPort = "";
  let localWebhookHost = "";

  try {
    const parsedLocal = new URL(localDirectusUrl);
    localHostAndPort = parsedLocal.host;
    
    const ipMatch = parsedLocal.hostname.match(/^(\d+\.\d+\.\d+\.)/);
    if (ipMatch) {
      localSubnet = ipMatch[1];
    } else {
      localSubnet = parsedLocal.hostname;
    }
  } catch (e) {
    console.warn("Error parsing VITE_DIRECTUS_URL in resolveNetworkUrl:", e);
    return url;
  }

  try {
    const parsedExternal = new URL(externalDirectusUrl);
    externalHostAndPort = parsedExternal.host;
  } catch (e) {
    console.warn("Error parsing VITE_DIRECTUS_URL_EXTERNAL in resolveNetworkUrl:", e);
    return url;
  }

  try {
    const parsedWebhook = new URL(localWebhookUrl);
    localWebhookHost = parsedWebhook.hostname;
  } catch (e) {
    console.warn("Error parsing VITE_WEBHOOK_URL_TRASLADOS in resolveNetworkUrl:", e);
    return url;
  }

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    (localSubnet && hostname.startsWith(localSubnet));

  if (isLocal) {
    return url;
  }

  let resolved = url.trim();

  if (resolved.includes(localHostAndPort)) {
    resolved = resolved.replace(localHostAndPort, externalHostAndPort);
  }

  if (localWebhookHost && resolved.includes(localWebhookHost)) {
    resolved = resolved.replace(localWebhookHost, externalWebhookHost);
  }

  return resolved;
}
