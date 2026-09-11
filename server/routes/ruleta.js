const express = require("express");
const { queryDB } = require("../utils/db");

const router = express.Router();

// ============================================================
// Premios por rango — debe reflejar rangos.ts del frontend
// Las probabilidades se aplican SOLO en el backend.
// ============================================================
const PREMIOS_POR_GRUPO = {
  altos: [
    { prize: "Jean de línea", probabilidad: 10 },
    { prize: "Jean básico", probabilidad: 40 },
    { prize: "Bono $100k", probabilidad: 50 },
  ],
  medios: [
    { prize: "Bono 50%", probabilidad: 70 },
    { prize: "Blusa básica", probabilidad: 15 },
    { prize: "Tote bag", probabilidad: 15 },
  ],
  bajos: [
    { prize: "Bandana", probabilidad: 20 },
    { prize: "Bamba", probabilidad: 20 },
    { prize: "Bono $30k", probabilidad: 60 },
  ],
};

// Umbrales de negocio (CON IVA)
const UMBRAL_BAJOS = 300000;   // ≤ 300.000 → bajos
const UMBRAL_MEDIOS = 600000;  // < 600.000 → medios, ≥ 600.000 → altos

const calcularPremiosElegibles = (monto) => {
  if (monto <= UMBRAL_BAJOS) return PREMIOS_POR_GRUPO.bajos;
  if (monto < UMBRAL_MEDIOS) return PREMIOS_POR_GRUPO.medios;
  return PREMIOS_POR_GRUPO.altos;
};

// Selección ponderada: respeta las probabilidades del grupo elegido
const elegirPremioPonderado = (premios) => {
  const total = premios.reduce((acc, p) => acc + p.probabilidad, 0);
  let rand = Math.random() * total;
  for (const p of premios) {
    if (rand < p.probabilidad) return p.prize;
    rand -= p.probabilidad;
  }
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

    const prize = elegirPremioPonderado(elegibles);
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