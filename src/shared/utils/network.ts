/**
 * Utility to resolve service URLs dynamically depending on the client network location.
 * If accessed from LAN (localhost or the subnet configured in environment variables), it uses local URLs.
 * If accessed externally, it translates the local Directus IP/Port to the configured public IP/Port.
 */
export function resolveNetworkUrl(url: string | undefined): string {
  if (!url) return "";

  // Browser-only execution check
  if (typeof window === "undefined") return url;

  const hostname = window.location.hostname;
  console.log("Hostname:", hostname);

  // Retrieve environment variables
  const localDirectusUrl = import.meta.env.VITE_DIRECTUS_URL;
  const externalDirectusUrl = import.meta.env.VITE_DIRECTUS_URL_EXTERNAL;
  const localWebhookUrl = import.meta.env.VITE_WEBHOOK_URL_TRASLADOS || "http://192.168.19.133:5678/";
  const externalWebhookHost = import.meta.env.VITE_WEBHOOK_HOST_EXTERNAL || "190.168.63.190";

  // If environment variables are not configured, return original URL
  if (!localDirectusUrl || !externalDirectusUrl) {
    return url;
  }

  // Extract subnet, host, and port configurations dynamically
  let localSubnet = "";
  let localHostAndPort = "";
  let externalHostAndPort = "";
  let localWebhookHost = "192.168.19.133";

  try {
    const parsedLocal = new URL(localDirectusUrl);
    localHostAndPort = parsedLocal.host; // e.g., "192.168.19.245:8055"
    
    // Attempt to extract the first three octets of the IP for LAN detection (e.g., "192.168.19.")
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
    externalHostAndPort = parsedExternal.host; // e.g., "190.145.63.190:8056"
  } catch (e) {
    console.warn("Error parsing VITE_DIRECTUS_URL_EXTERNAL in resolveNetworkUrl:", e);
    return url;
  }

  try {
    const parsedWebhook = new URL(localWebhookUrl);
    localWebhookHost = parsedWebhook.hostname; // e.g., "192.168.19.133"
  } catch (e) {
    // Fallback if URL parsing fails
  }

  // LAN network detection: localhost, loopback, or the extracted local subnet range
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    (localSubnet && hostname.startsWith(localSubnet));

  if (isLocal) {
    return url;
  }

  // WAN/External network mapping: replace the local Directus host and port with the external ones
  let resolved = url.trim();
  if (resolved.includes(localHostAndPort)) {
    resolved = resolved.replace(localHostAndPort, externalHostAndPort);
  }

  // WAN/External network mapping for webhooks: replace local webhook host with external one
  if (resolved.includes(localWebhookHost)) {
    resolved = resolved.replace(localWebhookHost, externalWebhookHost);
  }

  return resolved;
}
