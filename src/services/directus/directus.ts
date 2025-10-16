import { createDirectus, rest, authentication } from "@directus/sdk";

// 🔹 Leer la URL desde .env
const directusUrl = import.meta.env.VITE_DIRECTUS_URL;

// 1. Crear cliente con REST y autenticación
const directus = createDirectus(directusUrl)
  .with(rest())
  .with(authentication("json"));

export default directus;
