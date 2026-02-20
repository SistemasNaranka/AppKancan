/**
 * Servidor Unificado para Informe de Ventas
 *
 * Este servidor:
 * 1. Sirve el frontend estático (React)
 * 2. Expone la API para consultar MySQL
 *
 * Puerto: 11000 (configurable via PORT environment variable)
 *
 * Variables de entorno:
 * - DB_USER: Usuario de MySQL
 * - DB_PASSWORD: Contraseña de MySQL
 * - DB_HOST: Host de MySQL (default: 192.168.19.250)
 * - PORT: Puerto del servidor (default: 11000)
 */

// Cargar variables de entorno desde .env
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 11000;

// Configuración de la base de datos MySQL
const dbConfig = {
  host: process.env.DB_HOST || "192.168.19.250",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Ejecuta una consulta en una base de datos específica
 */
async function queryDB(database, sql, params = []) {
  const connection = await pool.getConnection();
  try {
    await connection.changeUser({ database });
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}

// ==================== API ENDPOINTS ====================

/**
 * GET /api/health
 * Verificar estado del servidor
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/zonas
 * Obtener zonas únicas de la tabla bodegas
 */
app.get("/api/zonas", async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT zona AS nombre 
      FROM kancan.bodegas 
      WHERE zona IS NOT NULL AND zona != '' 
      ORDER BY zona
    `;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener zonas:", error);
    res.status(500).json({ error: "Error al obtener zonas" });
  }
});

/**
 * GET /api/ciudades
 * Obtener ciudades únicas de la tabla bodegas
 */
app.get("/api/ciudades", async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT ciudad AS nombre 
      FROM kancan.bodegas 
      WHERE ciudad IS NOT NULL AND ciudad != '' 
      ORDER BY ciudad
    `;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener ciudades:", error);
    res.status(500).json({ error: "Error al obtener ciudades" });
  }
});

/**
 * GET /api/tiendas
 * Obtener tiendas/bodegas (solo tiendas, no bodegas de producción)
 * Incluye zona y ciudad directamente de la tabla bodegas
 * Filtro: bodega BETWEEN 3 AND 20 para Kancan, BETWEEN 3 AND 40 para Naranka
 */
app.get("/api/tiendas", async (req, res) => {
  try {
    // Obtener tiendas con zona y ciudad directamente de bodegas
    const sql = `
      SELECT DISTINCT 
        id, 
        nombre, 
        ciudad, 
        codigo_ultra, 
        subproceso_nombre, 
        categoria,
        zona
      FROM kancan.bodegas
      WHERE (id BETWEEN 3 AND 40) OR id IN (77, 94, 107)
      ORDER BY nombre
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql);

      // Eliminar duplicados por nombre
      const tiendasMap = new Map();
      rows.forEach((tienda) => {
        if (!tiendasMap.has(tienda.nombre)) {
          tiendasMap.set(tienda.nombre, tienda);
        }
      });

      const tiendas = Array.from(tiendasMap.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      );

      res.json(tiendas);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener tiendas:", error);
    res.status(500).json({ error: "Error al obtener tiendas" });
  }
});

/**
 * GET /api/grupos-homogeneos
 * Obtener grupos homogéneos (líneas de venta) con agrupación desde grupos
 */
app.get("/api/grupos-homogeneos", async (req, res) => {
  try {
    const sql = `
      SELECT gh.id, gh.nombre, gh.origen, gh.linea_venta, gh.id_grupo, g.agrupacion
      FROM naranka.grupos_homogeneos gh
      LEFT JOIN naranka.grupos g ON gh.id_grupo = g.id
      ORDER BY gh.nombre
    `;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener grupos homogéneos:", error);
    res.status(500).json({ error: "Error al obtener grupos homogéneos" });
  }
});

/**
 * GET /api/grupos
 * Obtener grupos con agrupación (Indigo/Liviano)
 */
app.get("/api/grupos", async (req, res) => {
  try {
    const sql = `
      SELECT id, nombre, tipo_prenda, agrupacion 
      FROM grupos 
      ORDER BY nombre
    `;
    const rows = await queryDB("naranka", sql);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    res.status(500).json({ error: "Error al obtener grupos" });
  }
});

/**
 * GET /api/agrupaciones
 * Obtener agrupaciones mapeadas para el usuario
 * Los 7 valores de BD se mapean a 4 grupos:
 * - Indigo: indigo, jeans
 * - Tela Liviana: nacional, importado, tela liviana
 * - Calzado: calzado
 * - Complemento: complemento
 */
app.get("/api/agrupaciones", async (req, res) => {
  try {
    // Devolver las 4 agrupaciones mapeadas para el usuario
    const agrupaciones = [
      { id: "Indigo", nombre: "Indigo", valores_bd: ["indigo", "jeans"] },
      {
        id: "Tela Liviana",
        nombre: "Tela Liviana",
        valores_bd: ["nacional", "importado", "tela liviana"],
      },
      { id: "Calzado", nombre: "Calzado", valores_bd: ["calzado"] },
      { id: "Complemento", nombre: "Complemento", valores_bd: ["complemento"] },
    ];
    res.json(agrupaciones);
  } catch (error) {
    console.error("Error al obtener agrupaciones:", error);
    res.status(500).json({ error: "Error al obtener agrupaciones" });
  }
});

/**
 * GET /api/lineas-venta
 * Obtener líneas de venta mapeadas para el usuario
 * Los valores de BD se mapean a 3 grupos:
 * - Colección: colección
 * - Básicos: basic
 * - Promoción: promocion, liquidacion, segundas
 */
app.get("/api/lineas-venta", async (req, res) => {
  try {
    // Devolver las 3 líneas de venta mapeadas para el usuario
    const lineas = [
      { id: "Colección", nombre: "Colección", valores_bd: ["colección"] },
      { id: "Básicos", nombre: "Básicos", valores_bd: ["basic"] },
      {
        id: "Promoción",
        nombre: "Promoción",
        valores_bd: ["promocion", "liquidacion", "segundas"],
      },
    ];
    res.json(lineas);
  } catch (error) {
    console.error("Error al obtener líneas de venta:", error);
    res.status(500).json({ error: "Error al obtener líneas de venta" });
  }
});

/**
 * GET /api/asesores
 * Obtener lista única de asesores
 */
app.get("/api/asesores", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear];

    const sqlKcn = years
      .map(
        (year) => `
      SELECT DISTINCT nombre_vendedor 
      FROM kcn_db.ventas_${year}
      WHERE nombre_vendedor IS NOT NULL AND nombre_vendedor != ''
    `,
      )
      .join(" UNION ");

    const sqlNaranka = years
      .map(
        (year) => `
      SELECT DISTINCT nombre_vendedor 
      FROM naranka.ventas_${year}
      WHERE nombre_vendedor IS NOT NULL AND nombre_vendedor != ''
    `,
      )
      .join(" UNION ");

    const sqlFinal = `${sqlKcn} UNION ${sqlNaranka}`;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal);
      const asesores = rows.map((r) => r.nombre_vendedor).sort();
      res.json(asesores);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener asesores:", error);
    res.status(500).json({ error: "Error al obtener asesores" });
  }
});

/**
 * GET /api/ventas
 * Obtener ventas con filtros, incluyendo línea de venta, agrupación, ciudad y zona
 * La zona y ciudad vienen directamente de la tabla bodegas
 */
app.get("/api/ventas", async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      bodega,
      asesor,
      zona,
      ciudad,
      linea_venta,
      agrupacion,
    } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({ error: "Las fechas son requeridas" });
    }

    const yearDesde = new Date(fecha_desde).getFullYear();
    const yearHasta = new Date(fecha_hasta).getFullYear();
    const years = [];
    for (let y = yearDesde; y <= yearHasta; y++) {
      years.push(y);
    }

    // Construir condiciones WHERE con valores literales
    let whereBase = `WHERE v.fecdoc BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`;

    if (bodega) {
      whereBase += ` AND v.nombre_bodega = '${bodega.replace(/'/g, "''")}'`;
    }

    if (asesor) {
      whereBase += ` AND v.nombre_vendedor = '${asesor.replace(/'/g, "''")}'`;
    }

    // Filtro por ciudad (directamente de bodegas)
    if (ciudad) {
      whereBase += ` AND bod.ciudad = '${ciudad.replace(/'/g, "''")}'`;
    }

    // Filtro por zona (directamente de bodegas)
    if (zona) {
      whereBase += ` AND bod.zona = '${zona.replace(/'/g, "''")}'`;
    }

    // Filtro por línea de venta (mapeado)
    // "Colección" → colección
    // "Básicos" → basic
    // "Promoción" → promocion, liquidacion, segundas
    if (linea_venta) {
      const lineaLower = linea_venta.toLowerCase();
      if (lineaLower === "colección" || lineaLower === "coleccion") {
        whereBase += ` AND LOWER(gh.linea_venta) = 'colección'`;
      } else if (lineaLower === "básicos" || lineaLower === "basicos") {
        whereBase += ` AND LOWER(gh.linea_venta) = 'basic'`;
      } else if (lineaLower === "promoción" || lineaLower === "promocion") {
        whereBase += ` AND LOWER(gh.linea_venta) IN ('promocion', 'liquidacion', 'segundas')`;
      } else {
        // Filtro directo si no es uno de los mapeados
        whereBase += ` AND gh.linea_venta = '${linea_venta.replace(/'/g, "''")}'`;
      }
    }

    // Filtro por agrupación (mapeado)
    // "Indigo" → indigo, jeans
    // "Tela Liviana" → nacional, importado, tela liviana
    // "Calzado" → calzado
    // "Complemento" → complemento
    if (agrupacion) {
      const agrupLower = agrupacion.toLowerCase();
      if (agrupLower === "indigo") {
        whereBase += ` AND LOWER(gr.agrupacion) IN ('indigo', 'jeans')`;
      } else if (agrupLower === "tela liviana") {
        whereBase += ` AND LOWER(gr.agrupacion) IN ('nacional', 'importado', 'tela liviana')`;
      } else if (agrupLower === "calzado") {
        whereBase += ` AND LOWER(gr.agrupacion) = 'calzado'`;
      } else if (agrupLower === "complemento") {
        whereBase += ` AND LOWER(gr.agrupacion) = 'complemento'`;
      } else {
        // Filtro directo si no es uno de los mapeados
        whereBase += ` AND gr.agrupacion = '${agrupacion.replace(/'/g, "''")}'`;
      }
    }

    // Consultas para cada año con JOIN a bodegas, referencias, grupos_homogeneos y grupos
    // Mapeo de líneas de venta y agrupaciones según reglas de negocio
    const sqlParts = [];

    // CASE para mapear línea de venta:
    // - "colección" → "Colección"
    // - "basic" → "Básicos"
    // - "promocion", "liquidacion", "segundas" → "Promoción"
    const lineaVentaCase = `
      CASE 
        WHEN LOWER(gh.linea_venta) IN ('promocion', 'liquidacion', 'segundas') THEN 'Promoción'
        WHEN LOWER(gh.linea_venta) = 'basic' THEN 'Básicos'
        WHEN LOWER(gh.linea_venta) = 'colección' THEN 'Colección'
        WHEN gh.linea_venta IS NULL THEN 'Sin línea'
        ELSE gh.linea_venta
      END AS linea_venta
    `;

    // CASE para mapear agrupación:
    // - "indigo", "jeans" → "Indigo"
    // - "nacional", "importado", "tela liviana" → "Tela Liviana"
    // - "calzado" → "Calzado"
    // - "complemento" → "Complemento"
    const agrupacionCase = `
      CASE 
        WHEN LOWER(gr.agrupacion) IN ('indigo', 'jeans') THEN 'Indigo'
        WHEN LOWER(gr.agrupacion) IN ('nacional', 'importado', 'tela liviana') THEN 'Tela Liviana'
        WHEN LOWER(gr.agrupacion) = 'calzado' THEN 'Calzado'
        WHEN LOWER(gr.agrupacion) = 'complemento' THEN 'Complemento'
        WHEN gr.agrupacion IS NULL THEN 'Sin agrupación'
        ELSE gr.agrupacion
      END AS agrupacion
    `;

    // Ventas y devoluciones de kcn_db
    years.forEach((year) => {
      sqlParts.push(`
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               ROUND(v.cantidad_venta, 0) AS venta, ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM kcn_db.ventas_${year} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 20
      `);
      sqlParts.push(`
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               -ROUND(v.cantidad, 0) AS venta, -ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM kcn_db.devoluciones_${year} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 20
      `);
    });

    // Ventas y devoluciones de naranka
    years.forEach((year) => {
      sqlParts.push(`
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               ROUND(v.cantidad_venta, 0) AS venta, ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM naranka.ventas_${year} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      sqlParts.push(`
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               -ROUND(v.cantidad, 0) AS venta, -ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM naranka.devoluciones_${year} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ALL ");

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

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
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📊 Frontend disponible en http://localhost:${PORT}`);
  console.log(`🔌 API disponible en http://localhost:${PORT}/api`);
  console.log(`💾 Conectando a MySQL: ${dbConfig.host}`);
});

module.exports = app;
