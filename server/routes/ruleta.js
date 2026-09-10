const express = require("express");
const { queryDB } = require("../utils/db");

const router = express.Router();

// ============================================================
// Config de premios por rango — debe reflejar rangos.ts del frontend
// ============================================================
const PREMIOS_POR_GRUPO = {
  altos: ["Jean de línea", "Jean básico", "Bonos $100k"],
  medios: ["Bonos $50k", "Bonos $30k", "Blusas básicas"],
  bajos: ["Tote bag denim", "Tops", "Pañoletas", "Bambas"],
};

// Umbrales de negocio (CON IVA) — exclusivo por tramo
const UMBRAL_BAJOS = 300000;
const UMBRAL_MEDIOS = 600000;

const calcularPremiosElegibles = (monto) => {
  if (monto <= UMBRAL_BAJOS) return [...PREMIOS_POR_GRUPO.bajos];    // $0–$300.000: solo bajos
  if (monto <= UMBRAL_MEDIOS) return [...PREMIOS_POR_GRUPO.medios];  // $300.001–$600.000: solo medios
  return [...PREMIOS_POR_GRUPO.altos];                               // $600.001+: solo altos
};

const generarCupon = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "KAN-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

router.post("/ruleta/validar-factura", async (req, res) => {
  const { documentos } = req.body;

  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res.status(400).json({ message: "Número de factura requerido" });
  }

  const anio = new Date().getFullYear();
  const tabla = `ventas_${anio}`;

  const sql = `
    SELECT
      documentos,
      cliente,
      fecdoc,
      SUM(total_factura) AS total,
      SUM(valor_venta_bruta) AS total_sin_iva
    FROM kcn_db.${tabla}
    WHERE documentos = ?
    GROUP BY documentos, cliente, fecdoc
    LIMIT 1
  `;

  try {
    const rows = await queryDB("kcn_db", sql, [documentos.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    const venta = rows[0];
    return res.json({
      documentos: venta.documentos,
      cliente: venta.cliente && venta.cliente.trim() ? venta.cliente.trim() : 'Sin nombre',
      fecha: venta.fecdoc,
      total: Number(venta.total),
      totalSinIva: Number(venta.total_sin_iva),
    });
  } catch (error) {
    console.error("Error al validar factura:", error);
    return res.status(500).json({ message: "Error al consultar la factura" });
  }
});

router.post("/ruleta/girar", async (req, res) => {
  const { documentos } = req.body;

  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res.status(400).json({ message: "Número de factura requerido" });
  }

  const anio = new Date().getFullYear();
  const tabla = `ventas_${anio}`;

  const sql = `
    SELECT
      documentos,
      cliente,
      SUM(total_factura) AS total
    FROM kcn_db.${tabla}
    WHERE documentos = ?
    GROUP BY documentos, cliente
    LIMIT 1
  `;

  try {
    const rows = await queryDB("kcn_db", sql, [documentos.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    const monto = Number(rows[0].total);
    const elegibles = calcularPremiosElegibles(monto);

    // ⚠️ PENDIENTE: validar que la factura no haya girado antes (anti-abuso)
    // ⚠️ PENDIENTE: registrar el resultado en Directus (sal_roulette_winners)

    const prize = elegibles[Math.floor(Math.random() * elegibles.length)];
    const couponCode = generarCupon();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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