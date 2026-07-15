import { createDirectus, rest, authentication, realtime } from "@directus/sdk";
import { resolveNetworkUrl } from "@/shared/utils/network";

const rawDirectusUrl = import.meta.env.VITE_DIRECTUS_URL;
const directusUrl = resolveNetworkUrl(rawDirectusUrl);

const directus = createDirectus(directusUrl)
  .with(authentication("json"))
  .with(rest())
  .with(realtime());

export { directusUrl };
export default directus;