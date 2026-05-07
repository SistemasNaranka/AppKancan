
import { directus } from "./src/apps/comisiones/api/directus/config";
import { readItems } from "@directus/sdk";

async function checkTypes() {
  try {
    const data = await directus.request(
      readItems("usuarios_tiendas", {
        fields: ["tienda_id"],
        limit: 1,
      })
    );
    if (data.length > 0) {
      console.log("Type of tienda_id in usuarios_tiendas:", typeof data[0].tienda_id, data[0].tienda_id);
    }

    const stores = await directus.request(
      readItems("util_tiendas", {
        fields: ["id"],
        limit: 1,
      })
    );
    if (stores.length > 0) {
      console.log("Type of id in util_tiendas:", typeof stores[0].id, stores[0].id);
    }
  } catch (e) {
    console.error(e);
  }
}

checkTypes();
