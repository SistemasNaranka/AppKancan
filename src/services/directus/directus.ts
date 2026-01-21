import { createDirectus, rest, authentication } from "@directus/sdk";

const directusUrl = import.meta.env.VITE_DIRECTUS_URL;

const directus = createDirectus(directusUrl)
  .with(rest())
  .with(authentication("json"));

export default directus;