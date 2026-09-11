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
  if (monto <= UMBRAL_BAJOS) return [...PREMIOS_POR_GRUPO.bajos];
  if (monto <= UMBRAL_MEDIOS) return [...PREMIOS_POR_GRUPO.medios];
  return [...PREMIOS_POR_GRUPO.altos];
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
// 🚫 CONTROL DE FACTURAS USADAS (anti doble giro)
// ============================================================
// Set en memoria. Al reiniciar el servidor se limpia.
// Para persistencia, migrar a Directus o a la BD.
const facturasUsadas = new Set();

// ============================================================
// ✅ VALIDAR FACTURA (solo cliente, sin monto)
// ============================================================
router.post("/ruleta/validar-factura", async (req, res) => {
  const { documentos } = req.body;

  if (!documentos || typeof documentos !== "string" || !documentos.trim()) {
    return res.status(400).json({ valid: false, message: "Número de factura requerido" });
  }

  const factura = documentos.trim().toUpperCase();

  // 🚫 Verificar si ya se usó
  if (facturasUsadas.has(factura)) {
    return res.status(409).json({
      valid: false,
      message: "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
    });
  }

  const anio = new Date().getFullYear();
  const tabla = `ventas_${anio}`;

  const sql = `
    SELECT documentos, cliente, SUM(total_factura) AS total
    FROM kcn_db.${tabla}
    WHERE documentos = ?
    GROUP BY documentos, cliente
    LIMIT 1
  `;

  try {
    const rows = await queryDB("kcn_db", sql, [factura]);

    if (rows.length === 0) {
      return res.status(404).json({ valid: false, message: "Factura no encontrada" });
    }

    const venta = rows[0];
    const nombreCliente = venta.cliente && venta.cliente.trim()
      ? venta.cliente.trim()
      : "Cliente no identificado";

    // ✅ Solo devolvemos cliente (sin monto, sin fecha, sin totalSinIva)
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

  // 🚫 Verificar si ya se usó
  if (facturasUsadas.has(factura)) {
    return res.status(409).json({
      message: "Esta factura ya participó en la ruleta. Solo se permite un giro por factura.",
    });
  }

  const anio = new Date().getFullYear();
  const tabla = `ventas_${anio}`;

  const sql = `
    SELECT documentos, cliente, SUM(total_factura) AS total
    FROM kcn_db.${tabla}
    WHERE documentos = ?
    GROUP BY documentos, cliente
    LIMIT 1
  `;

  try {
    const rows = await queryDB("kcn_db", sql, [factura]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    const monto = Number(rows[0].total);
    const elegibles = calcularPremiosElegibles(monto);

    const prize = elegibles[Math.floor(Math.random() * elegibles.length)];
    const couponCode = generarCupon();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 🚫 Marcar factura como usada (no puede volver a girar)
    facturasUsadas.add(factura);

    // ⚠️ PENDIENTE: guardar en Directus (sal_roulette_winners) para persistir
    console.log(`✅ Factura ${factura} usada. Premio: ${prize} | Cupón: ${couponCode}`);

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