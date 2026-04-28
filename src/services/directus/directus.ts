import { createDirectus, rest, authentication, realtime } from "@directus/sdk";

const directusUrl = import.meta.env.VITE_DIRECTUS_URL;

const directus = createDirectus(directusUrl)
  .with(authentication("json"))
  .with(rest())
  .with(realtime());

export default directus;