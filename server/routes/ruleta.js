const express = require("express");
const fetch = require("node-fetch");
const { queryDB } = require("../utils/db");
const authImport = require("../middleware/auth");
const auth = authImport.auth || authImport.default || authImport;




const router = express.Router();




const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN;




async function registrarJugadaDirectus({ invoiceKey, documento, bodega, prize }) {
  const resp = await fetch(`${DIRECTUS_URL}/items/sal_roulette_plays`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({
      invoice_key: invoiceKey,
      document_number: documento,
      store_code: bodega,
      prize,
    }),
  });




  if (resp.ok) return { ok: true };




  let body = null;
  try {
    body = await resp.json();
  } catch (_) { }




  const code = body?.errors?.[0]?.extensions?.code;
  if (code === "RECORD_NOT_UNIQUE") return { ok: false, duplicate: true };




  return { ok: false, duplicate: false, status: resp.status, body };
}




// ============================================================
// Umbrales de negocio (CON IVA) y mapeo a tiers de sal_prizes
// ============================================================
const UMBRAL_BAJOS = 300000;   // ≤ 300.000 → G3 (bajos)
const UMBRAL_MEDIOS = 600000;  // < 600.000 → G2 (medios), ≥ 600.000 → G1 (altos)




const tierPorMonto = (monto) => {
  if (monto <= UMBRAL_BAJOS) return "G3";
  if (monto < UMBRAL_MEDIOS) return "G2";
  return "G1";
};




// ============================================================
// 🎯 Premios disponibles: lee catálogo, cruza inventario y jugadas.
// Devuelve solo los premios del tier que aún tienen cupo en la tienda.
// ============================================================
async function obtenerPremiosDisponibles(tier, bodega) {
  // 1. Catálogo: premios activos del tier
  const catalogoUrl = `${DIRECTUS_URL}/items/sal_prizes?filter[tier][_eq]=${tier}&filter[is_active][_eq]=true&fields=id,name,probability`;
  const catalogoResp = await fetch(catalogoUrl, {
    headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
  });
  if (!catalogoResp.ok) throw new Error(`Directus catalogo: ${catalogoResp.status}`);
  const catalogoData = await catalogoResp.json();
  const catalogo = catalogoData?.data ?? [];
  if (catalogo.length === 0) return [];


  const prizeIds = catalogo.map((p) => p.id);


  // 2. Inventario asignado a esta tienda para esos premios
  const invUrl = `${DIRECTUS_URL}/items/sal_prize_inventory?filter[store_code][_eq]=${encodeURIComponent(bodega)}&filter[prize_id][_in]=${prizeIds.join(",")}&fields=prize_id,total_assigned`;
  const invResp = await fetch(invUrl, {
    headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
  });
  if (!invResp.ok) throw new Error(`Directus inventario: ${invResp.status}`);
  const invData = await invResp.json();
  const cupoPorPremio = new Map(
    (invData?.data ?? []).map((r) => [r.prize_id, r.total_assigned])
  );


  // 3. Jugadas ya entregadas en esta tienda para esos premios
  const nombres = catalogo.map((p) => p.name);
  const jugadasUrl = `${DIRECTUS_URL}/items/sal_roulette_plays?filter[store_code][_eq]=${encodeURIComponent(bodega)}&filter[prize][_in]=${nombres.map(encodeURIComponent).join(",")}&fields=prize&limit=-1`;
  const jugadasResp = await fetch(jugadasUrl, {
    headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
  });
  if (!jugadasResp.ok) throw new Error(`Directus jugadas: ${jugadasResp.status}`);
  const jugadasData = await jugadasResp.json();
  const entregasPorNombre = new Map();
  for (const j of jugadasData?.data ?? []) {
    entregasPorNombre.set(j.prize, (entregasPorNombre.get(j.prize) ?? 0) + 1);
  }


  // 4. Filtrar: dejar solo los que tienen cupo y aún no se agotaron
  return catalogo
    .filter((p) => {
      const cupo = cupoPorPremio.get(p.id);
      if (cupo === undefined) return false; // sin cupo asignado en esta tienda
      const entregados = entregasPorNombre.get(p.name) ?? 0;
      return entregados < cupo;
    })
    .map((p) => ({ prize: p.name, probabilidad: Number(p.probability) || 0 }));
}




// ============================================================
// 📊 Stock de los 3 rangos de una tienda, en una sola pasada.
// Devuelve por tier: total restante y premios vivos con su cupo
// restante. Restante = total_assigned - jugadas ya registradas.
// ============================================================
async function obtenerStockPorRangos(bodega) {
  const headers = { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` };


  const catalogoUrl = `${DIRECTUS_URL}/items/sal_prizes?filter[is_active][_eq]=true&fields=id,name,tier,probability&limit=-1`;
  const invUrl = `${DIRECTUS_URL}/items/sal_prize_inventory?filter[store_code][_eq]=${encodeURIComponent(bodega)}&fields=prize_id,total_assigned&limit=-1`;
  const jugadasUrl = `${DIRECTUS_URL}/items/sal_roulette_plays?filter[store_code][_eq]=${encodeURIComponent(bodega)}&fields=prize&limit=-1`;


  const [catalogoResp, invResp, jugadasResp] = await Promise.all([
    fetch(catalogoUrl, { headers }),
    fetch(invUrl, { headers }),
    fetch(jugadasUrl, { headers }),
  ]);


  if (!catalogoResp.ok) throw new Error(`Directus catalogo: ${catalogoResp.status}`);
  if (!invResp.ok) throw new Error(`Directus inventario: ${invResp.status}`);
  if (!jugadasResp.ok) throw new Error(`Directus jugadas: ${jugadasResp.status}`);


  const catalogo = (await catalogoResp.json())?.data ?? [];
  const inventario = (await invResp.json())?.data ?? [];
  const jugadas = (await jugadasResp.json())?.data ?? [];


  const cupoPorPremio = new Map(inventario.map((r) => [r.prize_id, r.total_assigned]));


  const entregasPorNombre = new Map();
  for (const j of jugadas) {
    entregasPorNombre.set(j.prize, (entregasPorNombre.get(j.prize) ?? 0) + 1);
  }


  const stock = {
    G1: { restanteTotal: 0, premios: [] },
    G2: { restanteTotal: 0, premios: [] },
    G3: { restanteTotal: 0, premios: [] },
  };


  for (const p of catalogo) {
    const cupo = cupoPorPremio.get(p.id);
    if (cupo === undefined) continue; // sin cupo asignado en esta tienda
    const entregados = entregasPorNombre.get(p.name) ?? 0;
    const restante = cupo - entregados;
    if (restante <= 0) continue;
    if (!stock[p.tier]) continue; // tier fuera de G1/G2/G3, se ignora


    stock[p.tier].premios.push({
      prize: p.name,
      probabilidad: (typeof p.probability === "number" && p.probability > 0) ? p.probability : 1,
      restante,
    });
    stock[p.tier].restanteTotal += restante;
  }


  return stock;
}




// ============================================================
// 🎲 SELECCIÓN PONDERADA REAL (respeta las probabilidades)
// ============================================================
const elegirPremioPonderado = (premios) => {
  const total = premios.reduce((acc, p) => acc + Number(p.probabilidad), 0);
  let rand = Math.random() * total;

  for (const p of premios) {
    if (rand < Number(p.probabilidad)) return p.prize;
    rand -= Number(p.probabilidad);
  }

  // Fallback con alerta para detectar fallos si los datos de la BD llegan corruptos
  console.error("Fallo crítico en matemática de sorteo. rand:", rand, "total:", total);
  return premios[premios.length - 1].prize;
};




const generarCupon = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "KAN-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};




// ============================================================
// ✅ VALIDAR FACTURA (consulta venta y valida en Directus)
// ============================================================
router.post("/ruleta/validar-factura", async (req, res) => {
  const { documentos } = req.body;




  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res.status(400).json({ valid: false, message: "Número de factura requerido" });
  }




  const factura = documentos.trim().toUpperCase();
  const anio = new Date().getFullYear();
  const tabla = `ventas_${anio}`;




  // Se añade bodega a la consulta para armar la clave compuesta invoiceKey
  const sql = `
    SELECT documentos, cliente, bodega, SUM(total_factura) AS total
    FROM kcn_db.${tabla}
    WHERE documentos = ?
    GROUP BY documentos, cliente, bodega
    LIMIT 1
  `;




  try {
    const rows = await queryDB("kcn_db", sql, [factura]);




    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: "Factura no encontrada" });
    }




    const venta = rows[0];
    const bodega = String(venta.bodega);
    const invoiceKey = `${bodega}-${factura}`;




    // 🚫 Candado temprano: validar contra Directus antes de habilitar el giro
    const checkUrl = `${DIRECTUS_URL}/items/sal_roulette_plays?filter[invoice_key][_eq]=${encodeURIComponent(invoiceKey)}&limit=1`;
    const checkResp = await fetch(checkUrl, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}`,
      },
    });
    const directusData = await checkResp.json();




    if (directusData?.data && directusData.data.length > 0) {
      return res.status(409).json({
        valid: false,
        message: "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
      });
    }




    const nombreCliente =
      venta.cliente && venta.cliente.trim()
        ? venta.cliente.trim()
        : "Cliente no identificado";


    const monto = Number(venta.total);
    const tier = tierPorMonto(monto);


    const stock = await obtenerStockPorRangos(bodega);
    const tiendaVacia =
      stock.G1.restanteTotal === 0 &&
      stock.G2.restanteTotal === 0 &&
      stock.G3.restanteTotal === 0;
    const restanteRango = stock[tier].restanteTotal;


    // Caso 4: tienda entera sin premios → no se puede girar en ningún rango
    if (tiendaVacia) {
      return res.json({
        valid: true,
        cliente: nombreCliente,
        puedeGirar: false,
        estadoStock: "TIENDA_VACIA",
        message: "No hay premios disponibles en ningún rango para esta tienda.",
      });
    }


    // Caso 3: el rango del cliente está agotado, pero la tienda tiene otros
    if (restanteRango === 0) {
      return res.json({
        valid: true,
        cliente: nombreCliente,
        puedeGirar: false,
        estadoStock: "RANGO_AGOTADO",
        message: "No hay premios en el rango de esta compra. Aún quedan premios en otros rangos.",
      });
    }


    // Caso 2: queda una sola unidad en el rango del cliente → gira, con aviso
    if (restanteRango === 1) {
      return res.json({
        valid: true,
        cliente: nombreCliente,
        puedeGirar: true,
        estadoStock: "ULTIMA_UNIDAD",
        message: "Solo queda un último premio en el rango de esta compra. Después de este giro se agota.",
      });
    }


    // Caso 1: stock normal en el rango → gira sin aviso especial
    return res.json({
      valid: true,
      cliente: nombreCliente,
      puedeGirar: true,
      estadoStock: "OK",
      message: "Factura validada con éxito",
    });
  } catch (error) {
    console.error("Error al validar factura:", error);
    return res.status(500).json({ valid: false, message: "Error al consultar la factura" });
  }
});




// ============================================================
// 🎡 GIRAR RULETA (con anti doble giro)
// ============================================================
router.post("/ruleta/girar", async (req, res) => {
  const { documentos } = req.body;




  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res.status(400).json({ message: "Número de factura requerido" });
  }




  const factura = documentos.trim().toUpperCase();




  const anio = new Date().getFullYear();
  const tabla = `ventas_${anio}`;




  const sql = `
    SELECT documentos, cliente, bodega, SUM(total_factura) AS total
    FROM kcn_db.${tabla}
    WHERE documentos = ?
    GROUP BY documentos, cliente, bodega
    LIMIT 1
  `;




  try {
    const rows = await queryDB("kcn_db", sql, [factura]);




    if (rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }




    const monto = Number(rows[0].total);
    const bodega = String(rows[0].bodega);
    const tier = tierPorMonto(monto);


    const elegibles = await obtenerPremiosDisponibles(tier, bodega);
    if (elegibles.length === 0) {
      return res.status(409).json({
        message: "No hay premios disponibles en esta tienda para el rango de tu compra.",
      });
    }


    const prize = elegirPremioPonderado(elegibles);




    const couponCode = generarCupon();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);




    const invoiceKey = `${bodega}-${factura}`;
    const registro = await registrarJugadaDirectus({
      invoiceKey,
      documento: factura,
      bodega,
      prize,
    });




    if (!registro.ok) {
      if (registro.duplicate) {
        return res.status(409).json({
          message: "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
        });
      }
      console.error("Error al registrar la jugada en Directus:", registro.status, registro.body);
      return res.status(500).json({ message: "Error al registrar el giro" });
    }




    return res.json({
      prize,
      couponCode,
      expiresAt: expiresAt.toISOString(),
      message: `🎉 ¡Felicidades! Has ganado ${prize}.`,
    });
  } catch (error) {
    console.error("Error al girar la ruleta:", error);
    return res.status(500).json({ message: "Error al procesar el giro" });
  }
});




// ============================================================
// 🔔 ESTADO DE STOCK POR TIENDA (para la campanita de la asesora)
// Devuelve el stock de los 3 rangos SIN validar factura.
// La tienda sale del ultra_code del usuario logueado.
// ============================================================
router.get("/ruleta/estado-stock/:bodega", async (req, res) => {
  const bodega = String(req.params.bodega || "").trim();
  if (!bodega) {
    return res.status(400).json({ message: "Código de tienda requerido" });
  }


  try {
    const stock = await obtenerStockPorRangos(bodega);


    const rangos = [
      { tier: "G1", nombre: "Rango alto", restante: stock.G1.restanteTotal },
      { tier: "G2", nombre: "Rango medio", restante: stock.G2.restanteTotal },
      { tier: "G3", nombre: "Rango bajo", restante: stock.G3.restanteTotal },
    ].map((r) => ({
      ...r,
      estado: r.restante === 0 ? "AGOTADO" : r.restante === 1 ? "ULTIMO" : "OK",
    }));


    const hayCriticos = rangos.some((r) => r.estado !== "OK");


    return res.json({ bodega, rangos, hayCriticos });
  } catch (error) {
    console.error("Error al consultar estado de stock:", error);
    return res.status(500).json({ message: "Error al consultar el stock" });
  }
});


module.exports = router;



