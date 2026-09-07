const express = require("express");
const { queryDB } = require("../utils/db");

const router = express.Router();

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

module.exports = router;