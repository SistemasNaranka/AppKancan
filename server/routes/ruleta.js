const express = require("express");
const fetch = require("node-fetch");
const { queryDB } = require("../utils/db");




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
    .map((p) => ({ prize: p.name, probabilidad: p.probability }));
}




// ============================================================
// 🎲 SELECCIÓN PONDERADA REAL (respeta las probabilidades)
// ============================================================
const elegirPremioPonderado = (premios) => {
  const total = premios.reduce((acc, p) => acc + p.probabilidad, 0);
  let rand = Math.random() * total;




  for (const p of premios) {
    if (rand < p.probabilidad) return p.prize;
    rand -= p.probabilidad;
  }




  // Fallback (no debería llegar aquí)
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




    // ✅ Factura existente y virgen en la ruleta
    return res.json({
      valid: true,
      cliente: nombreCliente,
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




module.exports = router;



