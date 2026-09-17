const express = require("express");
const fetch = require("node-fetch");
const crypto = require("crypto");
const { queryDB } = require("../utils/db");

const router = express.Router();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN;


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
  try { body = await resp.json(); } catch (_) { }

  const code = body?.errors?.[0]?.extensions?.code;
  if (code === "RECORD_NOT_UNIQUE") return { ok: false, duplicate: true };

  return { ok: false, duplicate: false, status: resp.status, body };
}


// ============================================================
// 🎁 PREMIOS POR RANGO — SISTEMA DE INTERVALOS 0-100
// ------------------------------------------------------------
// Cada premio tiene un "desde" y un "hasta" (números del 0 al 100).
// Se genera un número aleatorio entre 0 y 100 y según dónde caiga
// se gana ese premio.
//
// Ejemplo con ALTOS:
//   Jean de línea:  desde 0   hasta 10   →  0% a 10%   (10%)
//   Jean básico:    desde 10  hasta 50   →  10% a 50%  (40%)
//   Bono $100k:     desde 50  hasta 100  →  50% a 100% (50%)
//
// Los rangos NO pueden solaparse y deben cubrir todo el 0-100.
// ============================================================
const PREMIOS_POR_GRUPO = {
  altos: [
    { prize: "Jean de línea", desde: 0, hasta: 10 },  // 10%
    { prize: "Jean básico", desde: 10, hasta: 50 },  // 40%
    { prize: "Bono $100k", desde: 50, hasta: 100 },  // 50%
  ],
  medios: [
    { prize: "Bono $50k", desde: 0, hasta: 70 },  // 70%
    { prize: "Blusa básica", desde: 70, hasta: 85 },  // 15%
    { prize: "Tote bag", desde: 85, hasta: 100 },  // 15%
  ],
  bajos: [
    { prize: "Bandana", desde: 0, hasta: 20 },  // 20%
    { prize: "Bamba", desde: 20, hasta: 40 },  // 20%
    { prize: "Bono $30k", desde: 40, hasta: 100 },  // 60%
  ],
};

// ============================================================
// 🛡️ VALIDACIÓN DE CONFIGURACIÓN — corre una sola vez al cargar
// el módulo. Si alguien edita PREMIOS_POR_GRUPO y deja un hueco,
// un solapamiento, o un grupo que no llega exactamente a 100,
// el servidor falla al arrancar en vez de repartir premios mal
// calculados en producción sin que nadie se dé cuenta.
// ============================================================
function validarConfiguracionPremios(grupos) {
  for (const [nombreGrupo, premios] of Object.entries(grupos)) {
    if (!Array.isArray(premios) || premios.length === 0) {
      throw new Error(`[ruleta] El grupo "${nombreGrupo}" no tiene premios configurados`);
    }

    const ordenados = [...premios].sort((a, b) => a.desde - b.desde);

    if (ordenados[0].desde !== 0) {
      throw new Error(
        `[ruleta] El grupo "${nombreGrupo}" no empieza en 0 (empieza en ${ordenados[0].desde})`
      );
    }

    for (let i = 0; i < ordenados.length; i++) {
      const actual = ordenados[i];

      if (typeof actual.desde !== "number" || typeof actual.hasta !== "number" || actual.hasta <= actual.desde) {
        throw new Error(
          `[ruleta] Rango inválido en "${nombreGrupo}" para "${actual.prize}": desde=${actual.desde}, hasta=${actual.hasta}`
        );
      }

      const siguiente = ordenados[i + 1];
      if (siguiente) {
        if (siguiente.desde < actual.hasta) {
          throw new Error(
            `[ruleta] Rangos solapados en "${nombreGrupo}" entre "${actual.prize}" y "${siguiente.prize}"`
          );
        }
        if (siguiente.desde > actual.hasta) {
          throw new Error(
            `[ruleta] Hueco en "${nombreGrupo}" entre "${actual.prize}" (hasta ${actual.hasta}) y "${siguiente.prize}" (desde ${siguiente.desde})`
          );
        }
      }
    }

    const ultimo = ordenados[ordenados.length - 1];
    if (ultimo.hasta !== 100) {
      throw new Error(
        `[ruleta] El grupo "${nombreGrupo}" no termina en 100 (termina en ${ultimo.hasta})`
      );
    }
  }
}

// Se ejecuta al cargar el archivo — si algo está mal configurado,
// el servidor no arranca en vez de repartir premios mal calculados.
validarConfiguracionPremios(PREMIOS_POR_GRUPO);


// Umbrales de monto
const UMBRAL_BAJOS = 300000;
const UMBRAL_MEDIOS = 600000;

const calcularPremiosElegibles = (monto) => {
  if (monto <= UMBRAL_BAJOS) return PREMIOS_POR_GRUPO.bajos;
  if (monto < UMBRAL_MEDIOS) return PREMIOS_POR_GRUPO.medios;
  return PREMIOS_POR_GRUPO.altos;
};


// ============================================================
// 🎲 SORTEO POR INTERVALOS
// ------------------------------------------------------------
// 1. Genera un número entre 0 y 99 con crypto.randomInt (seguro,
//    no manipulable/predecible como Math.random).
// 2. Busca en qué intervalo cae.
// 3. Devuelve el premio de ese intervalo.
// ============================================================
const elegirPremioPorIntervalo = (premios) => {
  const numero = crypto.randomInt(0, 100); // 0 a 99

  for (const p of premios) {
    if (numero >= p.desde && numero < p.hasta) {
      console.log(`[ruleta] numero=${numero} → premio="${p.prize}" (rango ${p.desde}-${p.hasta})`);
      return p.prize;
    }
  }

  // Gracias a validarConfiguracionPremios() esto ya no debería poder
  // pasar nunca (los rangos siempre cubren 0-100 sin huecos), pero se
  // deja como red de seguridad extra.
  console.warn(`[ruleta] numero=${numero} no cayó en ningún intervalo. Usando último premio.`);
  return premios[premios.length - 1].prize;
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
// ✅ VALIDAR FACTURA
// ============================================================
router.post("/ruleta/validar-factura", async (req, res) => {
  const { documentos } = req.body;

  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res.status(400).json({ valid: false, message: "Número de factura requerido" });
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
      return res.status(404).json({ valid: false, message: "Factura no encontrada" });
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
        message: "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
      });
    }

    const nombreCliente = venta.cliente && venta.cliente.trim()
      ? venta.cliente.trim()
      : "Cliente no identificado";

    return res.json({ valid: true, cliente: nombreCliente, message: "Factura validada con éxito" });
  } catch (error) {
    console.error("Error al validar factura:", error);
    return res.status(500).json({ valid: false, message: "Error al consultar la factura" });
  }
});


// ============================================================
// 🎡 GIRAR RULETA
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

    let prize;
    try {
      prize = elegirPremioPorIntervalo(elegibles);
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