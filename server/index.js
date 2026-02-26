/**
 * Servidor Backend - AppKancan
 *
 * Estructura modular:
 * - /middleware/auth.js - Autenticación con Directus
 * - /routes/informeVentas.js - Rutas de informe de ventas
 * - /utils/db.js - Utilidades de base de datos
 * - /utils/validators.js - Validadores
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const path = require("path");

// Importar rutas
const informeVentasRoutes = require("./routes/informeVentas");

// Importar utilidades
const { dbConfig } = require("./utils/db");

const app = express();
const PORT = process.env.PORT || 11000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== API ROUTES ====================

// Health check (público)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rutas de informe de ventas (protegidas)
app.use("/api", informeVentasRoutes);

// ==================== SERVIR FRONTEND ====================

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "../dist")));

// Para cualquier ruta que no sea API, servir index.html (SPA)
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  } else {
    res.status(404).json({ error: "Endpoint no encontrado" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Conectando a MySQL: ${dbConfig.host}`);
});

module.exports = app;
