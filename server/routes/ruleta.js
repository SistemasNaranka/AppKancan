const express = require("express");
const fetch = require("node-fetch");
const crypto = require("crypto");
const { queryDB } = require("../utils/db");

const router = express.Router();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN;

// ============================================================
// 🎁 PREMIOS POR RANGO
// ------------------------------------------------------------
// Cada premio tiene 4 datos:
//   - probabilidad: peso dentro del pool (% sobre 100)
//   - ventana: cada cuántos giros se revisa el tope
//   - maxEnVentana: máximo de veces que puede salir dentro
//                   de esa ventana
//
// ⭐ Si quieres "1 vez cada X giros": ventana = X, maxEnVentana = 1
// ============================================================
const PREMIOS_POR_GRUPO = {
  // 🔴 ALTOS — factura ≥ $600.000
  altos: [
    { prize: "Jean de línea", probabilidad: 1,  ventana: 60, maxEnVentana: 1 },  // 1 vez cada 60
    { prize: "Jean básico",   probabilidad: 4,  ventana: 60, maxEnVentana: 1 },  // 1 vez cada 60
    { prize: "Bono $100k",    probabilidad: 95, ventana: 60, maxEnVentana: 99 },
  ],

  // 🟡 MEDIOS — factura $300.001 a $599.999
  medios: [
    { prize: "Bono $50k",     probabilidad: 98, ventana: 60, maxEnVentana: 99 },
    { prize: "Blusa básica",  probabilidad: 1,  ventana: 60, maxEnVentana: 1 },  // 1 vez cada 60
    { prize: "Tote bag",      probabilidad: 1,  ventana: 60, maxEnVentana: 1 },  // 1 vez cada 60
  ],

  // 🟢 BAJOS — factura ≤ $300.000
  bajos: [
    { prize: "Bandana",       probabilidad: 1,  ventana: 40, maxEnVentana: 1 },  // 1 vez cada 40
    { prize: "Bamba",         probabilidad: 1,  ventana: 40, maxEnVentana: 1 },  // 1 vez cada 40
    { prize: "Bono $30k",     probabilidad: 98, ventana: 40, maxEnVentana: 99 },
  ],
};

// Umbrales de negocio (CON IVA)
const UMBRAL_BAJOS = 300000;
const UMBRAL_MEDIOS = 600000;

const calcularPremiosElegibles = (monto) => {
  if (monto <= UMBRAL_BAJOS) return PREMIOS_POR_GRUPO.bajos;
  if (monto < UMBRAL_MEDIOS) return PREMIOS_POR_GRUPO.medios;
  return PREMIOS_POR_GRUPO.altos;
};


// ============================================================
// 📝 REGISTRAR JUGADA EN DIRECTUS
// ============================================================
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
  } catch (_) {}

  const code = body?.errors?.[0]?.extensions?.code;
  if (code === "RECORD_NOT_UNIQUE") return { ok: false, duplicate: true };

  return { ok: false, duplicate: false, status: resp.status, body };
}


// ============================================================
// 📊 TRAER LAS ÚLTIMAS N JUGADAS DE LA TIENDA
// ============================================================
async function obtenerUltimasJugadas(bodega, cantidad) {
  const url =
    `${DIRECTUS_URL}/items/sal_roulette_plays` +
    `?filter[store_code][_eq]=${encodeURIComponent(bodega)}` +
    `&fields=prize` +
    `&sort=-id` +
    `&limit=${cantidad}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
  });
  if (!resp.ok) throw new Error(`Directus ventana: ${resp.status}`);

  const data = await resp.json();
  return data?.data ?? [];
}


// ============================================================
// 🚫 FILTRAR PREMIOS SEGÚN SU VENTANA Y TOPE
// ------------------------------------------------------------
// Para cada premio se mira SOLO su propia ventana (40 o 60).
// Si ya salió `maxEnVentana` veces dentro de esa ventana,
// se bloquea hasta que las jugadas viejas salgan.
// ============================================================
async function filtrarPorVentana(bodega, elegibles) {
  const ventanaMax = Math.max(...elegibles.map((p) => p.ventana));
  const ultimas = await obtenerUltimasJugadas(bodega, ventanaMax);

  const filtrados = elegibles.filter((p) => {
    const enVentana = ultimas.slice(0, p.ventana);
    const veces = enVentana.filter((j) => j.prize === p.prize).length;
    return veces < p.maxEnVentana;
  });

  if (filtrados.length === 0) {
    console.warn(
      `[RULETA] ⚠️ Todos los premios alcanzaron su tope en tienda ${bodega}. Se usan los originales.`
    );
    return elegibles;
  }

  console.log("[RULETA] Ventana:", {
    bodega,
    ultimasConsultadas: ultimas.length,
    bloqueados: elegibles
      .filter((p) => !filtrados.includes(p))
      .map((p) => p.prize),
  });

  return filtrados;
}


// ============================================================
// 🎲 SORTEO POR POOL EXACTO
// ============================================================
const elegirPremioPonderado = (premios) => {
  const validos = premios
    .map((p) => ({
      prize: p.prize,
      probabilidad: Math.max(0, Math.round(Number(p.probabilidad) || 0)),
    }))
    .filter((p) => p.probabilidad > 0);

  if (validos.length === 0) {
    throw new Error("No hay premios con probabilidad válida (> 0).");
  }

  const pool = [];
  for (const p of validos) {
    for (let i = 0; i < p.probabilidad; i++) {
      pool.push(p.prize);
    }
  }

  const indice = crypto.randomInt(0, pool.length);
  return pool[indice];
};


// ============================================================
// 🎟️ GENERAR CUPÓN
// ============================================================
const generarCupon = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "KAN-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
};


// ============================================================
// ✅ ENDPOINT: VALIDAR FACTURA
// ============================================================
router.post("/ruleta/validar-factura", async (req, res) => {
  const { documentos } = req.body;

  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res
      .status(400)
      .json({ valid: false, message: "Número de factura requerido" });
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
      return res
        .status(404)
        .json({ valid: false, message: "Factura no encontrada" });
    }

    const venta = rows[0];
    const bodega = String(venta.bodega);
    const invoiceKey = `${bodega}-${factura}`;

    const checkUrl = `${DIRECTUS_URL}/items/sal_roulette_plays?filter[invoice_key][_eq]=${encodeURIComponent(invoiceKey)}&limit=1`;
    const checkResp = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
    });
    const directusData = await checkResp.json();

    if (directusData?.data && directusData.data.length > 0) {
      return res.status(409).json({
        valid: false,
        message:
          "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
      });
    }

    const nombreCliente =
      venta.cliente && venta.cliente.trim()
        ? venta.cliente.trim()
        : "Cliente no identificado";

    return res.json({
      valid: true,
      cliente: nombreCliente,
      message: "Factura validada con éxito",
    });
  } catch (error) {
    console.error("Error al validar factura:", error);
    return res
      .status(500)
      .json({ valid: false, message: "Error al consultar la factura" });
  }
});


// ============================================================
// 🎡 ENDPOINT: GIRAR RULETA
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

    const elegibles = calcularPremiosElegibles(monto);

    let elegiblesFiltrados;
    try {
      elegiblesFiltrados = await filtrarPorVentana(bodega, elegibles);
    } catch (err) {
      console.error("Error al consultar ventana:", err);
      elegiblesFiltrados = elegibles;
    }

    let prize;
    try {
      prize = elegirPremioPonderado(elegiblesFiltrados);
    } catch (err) {
      console.error("Error en sorteo:", err);
      return res.status(500).json({ message: "Error al calcular el premio" });
    }

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
          message:
            "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
        });
      }
      console.error(
        "Error al registrar la jugada en Directus:",
        registro.status,
        registro.body
      );
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