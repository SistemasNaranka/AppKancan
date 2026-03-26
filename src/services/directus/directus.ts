import { createDirectus, rest, authentication } from "@directus/sdk";

const directusUrl = import.meta.env.VITE_DIRECTUS_URL;

const directus = createDirectus(directusUrl)
  .with(authentication("json"))
  .with(rest());

export default directus;