const express = require("express");
const router = express.Router();
const { getConnection, queryDB } = require("../utils/db");
const { isValidDateFormat, isValidYear } = require("../utils/validators");
const { verifyDirectusToken } = require("../middleware/auth");

/**
 * GET /api/zonas
 * Obtener zonas únicas desde las ventas (JOIN con kancan.bodegas)
 * PROTEGIDO: Requiere autenticación
 * OPTIMIZACIÓN: Sin parámetros de fecha para cache, consulta simplificada
 */

let zonasCache = null;
let zonasCacheTime = 0;
const ZONAS_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

router.get("/zonas", verifyDirectusToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    // Cache key basado en fechas
    const cacheKey = `${fecha_desde || "default"}-${fecha_hasta || "default"}`;
    const now = Date.now();

    if (
      !fecha_desde &&
      !fecha_hasta &&
      zonasCache &&
      now - zonasCacheTime < ZONAS_CACHE_TTL
    ) {
      return res.json(zonasCache);
    }

    // Validar fechas si se proporcionan
    let years;
    if (fecha_desde && fecha_hasta) {
      if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }
      const yearDesde = new Date(fecha_desde).getFullYear();
      const yearHasta = new Date(fecha_hasta).getFullYear();

      if (!isValidYear(yearDesde) || !isValidYear(yearHasta)) {
        return res.status(400).json({ error: "Año fuera del rango válido" });
      }

      years = [];
      for (let y = yearDesde; y <= yearHasta; y++) {
        years.push(y);
      }
    } else {
      const currentYear = new Date().getFullYear();
      years = [currentYear];
    }

    const sqlParts = [];
    const params = [];

    const yearsToQuery = years.slice(-2);

    yearsToQuery.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 40`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }

      // kcn_db.ventas
      sqlParts.push(`
        SELECT DISTINCT bod.zona AS nombre 
        FROM kcn_db.ventas_${safeYear} v
        INNER JOIN kancan.bodegas bod ON v.nombre_bodega = bod.nombre
        WHERE ${whereClause} AND bod.zona IS NOT NULL AND bod.zona != ''
      `);

      // naranka.ventas
      sqlParts.push(`
        SELECT DISTINCT bod.zona AS nombre 
        FROM naranka.ventas_${safeYear} v
        INNER JOIN kancan.bodegas bod ON v.nombre_bodega = bod.nombre
        WHERE ${whereClause} AND bod.zona IS NOT NULL AND bod.zona != ''
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ") + " ORDER BY nombre";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal, params);

      const zonasMap = new Map();
      rows.forEach((row) => {
        if (row.nombre) {
          zonasMap.set(row.nombre, row.nombre);
        }
      });

      const zonas = Array.from(zonasMap.values()).sort();
      const result = zonas.map((nombre) => ({ nombre }));

      // Guardar en cache solo si es consulta sin fechas
      if (!fecha_desde && !fecha_hasta) {
        zonasCache = result;
        zonasCacheTime = now;
      }

      res.json(result);
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
 * Obtener ciudades únicas desde las ventas (JOIN con kancan.bodegas)
 * PROTEGIDO: Requiere autenticación
 * OPTIMIZACIÓN: Cache en memoria + consulta optimizada
 */

let ciudadesCache = null;
let ciudadesCacheTime = 0;

router.get("/ciudades", verifyDirectusToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const now = Date.now();

    // Cache solo para consultas sin fecha
    if (
      !fecha_desde &&
      !fecha_hasta &&
      ciudadesCache &&
      now - ciudadesCacheTime < ZONAS_CACHE_TTL
    ) {
      return res.json(ciudadesCache);
    }

    let years;
    if (fecha_desde && fecha_hasta) {
      if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }
      const yearDesde = new Date(fecha_desde).getFullYear();
      const yearHasta = new Date(fecha_hasta).getFullYear();

      if (!isValidYear(yearDesde) || !isValidYear(yearHasta)) {
        return res.status(400).json({ error: "Año fuera del rango válido" });
      }

      years = [];
      for (let y = yearDesde; y <= yearHasta; y++) {
        years.push(y);
      }
    } else {
      const currentYear = new Date().getFullYear();
      years = [currentYear];
    }

    const sqlParts = [];
    const params = [];
    const yearsToQuery = years.slice(-2); // Máximo 2 años

    yearsToQuery.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 40`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }

      // kcn_db.ventas - usando INNER JOIN más eficiente
      sqlParts.push(`
        SELECT DISTINCT bod.ciudad AS nombre 
        FROM kcn_db.ventas_${safeYear} v
        INNER JOIN kancan.bodegas bod ON v.nombre_bodega = bod.nombre
        WHERE ${whereClause} AND bod.ciudad IS NOT NULL AND bod.ciudad != ''
      `);

      // naranka.ventas
      sqlParts.push(`
        SELECT DISTINCT bod.ciudad AS nombre 
        FROM naranka.ventas_${safeYear} v
        INNER JOIN kancan.bodegas bod ON v.nombre_bodega = bod.nombre
        WHERE ${whereClause} AND bod.ciudad IS NOT NULL AND bod.ciudad != ''
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ") + " ORDER BY nombre";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal, params);

      const ciudadesMap = new Map();
      rows.forEach((row) => {
        if (row.nombre) {
          ciudadesMap.set(row.nombre, row.nombre);
        }
      });

      const ciudades = Array.from(ciudadesMap.values()).sort();
      const result = ciudades.map((nombre) => ({ nombre }));

      // Cache solo sin fechas
      if (!fecha_desde && !fecha_hasta) {
        ciudadesCache = result;
        ciudadesCacheTime = now;
      }

      res.json(result);
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
 * Obtener tiendas/bodegas desde las ventas
 * PROTEGIDO: Requiere autenticación
 * OPTIMIZACIÓN: Cache + consulta optimizada
 */

let tiendasCache = null;
let tiendasCacheTime = 0;

router.get("/tiendas", verifyDirectusToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const now = Date.now();

    // Cache solo para consultas sin fecha
    if (
      !fecha_desde &&
      !fecha_hasta &&
      tiendasCache &&
      now - tiendasCacheTime < ZONAS_CACHE_TTL
    ) {
      return res.json(tiendasCache);
    }

    let years;
    if (fecha_desde && fecha_hasta) {
      if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }
      const yearDesde = new Date(fecha_desde).getFullYear();
      const yearHasta = new Date(fecha_hasta).getFullYear();

      if (!isValidYear(yearDesde) || !isValidYear(yearHasta)) {
        return res.status(400).json({ error: "Año fuera del rango válido" });
      }

      years = [];
      for (let y = yearDesde; y <= yearHasta; y++) {
        years.push(y);
      }
    } else {
      const currentYear = new Date().getFullYear();
      years = [currentYear];
    }

    const sqlParts = [];
    const params = [];
    const yearsToQuery = years.slice(-2); // Máximo 2 años

    yearsToQuery.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 40`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }

      // kcn_db.ventas - INNER JOIN más eficiente
      sqlParts.push(`
        SELECT DISTINCT 
          v.bodega AS id, 
          v.nombre_bodega AS nombre, 
          bod.ciudad, 
          bod.zona
        FROM kcn_db.ventas_${safeYear} v
        INNER JOIN kancan.bodegas bod ON v.nombre_bodega = bod.nombre
        WHERE ${whereClause}
      `);

      // naranka.ventas
      sqlParts.push(`
        SELECT DISTINCT 
          v.bodega AS id, 
          v.nombre_bodega AS nombre, 
          bod.ciudad, 
          bod.zona
        FROM naranka.ventas_${safeYear} v
        INNER JOIN kancan.bodegas bod ON v.nombre_bodega = bod.nombre
        WHERE ${whereClause}
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ") + " ORDER BY nombre";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal, params);

      const tiendasMap = new Map();
      rows.forEach((tienda) => {
        if (!tiendasMap.has(tienda.nombre)) {
          tiendasMap.set(tienda.nombre, tienda);
        }
      });

      const tiendas = Array.from(tiendasMap.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      );

      if (!fecha_desde && !fecha_hasta) {
        tiendasCache = tiendas;
        tiendasCacheTime = now;
      }

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
 * PROTEGIDO: Requiere autenticación
 */
router.get("/grupos-homogeneos", verifyDirectusToken, async (req, res) => {
  try {
    const sql = `
      SELECT gh.id, gh.nombre, gh.origen, gh.linea_venta, gh.id_grupo, g.agrupacion
      FROM naranka.grupos_homogeneos gh
      LEFT JOIN naranka.grupos g ON gh.id_grupo = g.id
      ORDER BY gh.nombre
    `;
    const connection = await getConnection();
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
 * PROTEGIDO: Requiere autenticación
 */
router.get("/grupos", verifyDirectusToken, async (req, res) => {
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
 * PROTEGIDO: Requiere autenticación
 * OPTIMIZACIÓN: Datos estáticos, cacheados en memoria del servidor
 */
let agrupacionesCache = null;
let agrupacionesCacheTime = 0;
const AGRUPACIONES_CACHE_TTL = 60 * 60 * 1000; // 1 hora

router.get("/agrupaciones", verifyDirectusToken, async (req, res) => {
  try {
    const now = Date.now();
    if (
      agrupacionesCache &&
      now - agrupacionesCacheTime < AGRUPACIONES_CACHE_TTL
    ) {
      return res.json(agrupacionesCache);
    }

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

    agrupacionesCache = agrupaciones;
    agrupacionesCacheTime = now;

    res.json(agrupaciones);
  } catch (error) {
    console.error("Error al obtener agrupaciones:", error);
    res.status(500).json({ error: "Error al obtener agrupaciones" });
  }
});

/**
 * GET /api/lineas-venta
 * Obtener líneas de venta mapeadas para el usuario
 * PROTEGIDO: Requiere autenticación
 * OPTIMIZACIÓN: Datos estáticos cacheados en memoria
 */

let lineasVentaCache = null;
let lineasVentaCacheTime = 0;

router.get("/lineas-venta", verifyDirectusToken, async (req, res) => {
  try {
    const now = Date.now();
    if (
      lineasVentaCache &&
      now - lineasVentaCacheTime < AGRUPACIONES_CACHE_TTL
    ) {
      return res.json(lineasVentaCache);
    }

    const lineas = [
      { id: "Colección", nombre: "Colección", valores_bd: ["colección"] },
      { id: "Básicos", nombre: "Básicos", valores_bd: ["basic"] },
      {
        id: "Promoción",
        nombre: "Promoción",
        valores_bd: ["promocion", "liquidacion", "segundas"],
      },
    ];

    lineasVentaCache = lineas;
    lineasVentaCacheTime = now;

    res.json(lineas);
  } catch (error) {
    console.error("Error al obtener líneas de venta:", error);
    res.status(500).json({ error: "Error al obtener líneas de venta" });
  }
});

/**
 * GET /api/asesores
 * Obtener lista única de asesores
 * PROTEGIDO: Requiere autenticación
 * OPTIMIZACIÓN: Cache + query optimizada
 */

let asesoresCache = null;
let asesoresCacheTime = 0;

router.get("/asesores", verifyDirectusToken, async (req, res) => {
  try {
    const now = Date.now();

    if (asesoresCache && now - asesoresCacheTime < ZONAS_CACHE_TTL) {
      return res.json(asesoresCache);
    }

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear].filter((y) => isValidYear(y));

    if (years.length === 0) {
      return res.status(400).json({ error: "Años inválidos" });
    }

    const sqlParts = [];
    const params = [];

    years.forEach((year) => {
      // kcn_db - solo año más reciente para velocidad
      if (year === currentYear) {
        sqlParts.push(`
          SELECT DISTINCT nombre_vendedor 
          FROM kcn_db.ventas_${year}
          WHERE nombre_vendedor IS NOT NULL AND nombre_vendedor != ''
        `);

        sqlParts.push(`
          SELECT DISTINCT nombre_vendedor 
          FROM naranka.ventas_${year}
          WHERE nombre_vendedor IS NOT NULL AND nombre_vendedor != ''
        `);
      }
    });
    const sqlFinal = sqlParts.join(" UNION ") + " LIMIT 5000";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal);
      const asesores = [...new Set(rows.map((r) => r.nombre_vendedor))].sort();

      asesoresCache = asesores;
      asesoresCacheTime = now;

      res.json(asesores);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener asesores:", error);
    res.status(500).json({ error: "Error al obtener asesores" });
  }
});
router.get("/ventas", verifyDirectusToken, async (req, res) => {
  try {
    const ventasCache = new Map();
    const VENTAS_CACHE_TTL = 5 * 60 * 1000;

    const {
      fecha_desde,
      fecha_hasta,
      bodega,
      asesor,
      zona,
      ciudad,
      linea_venta,
      agrupacion,
      page = 0,
      limit = 10000,
    } = req.query;

    let fechaDesde = fecha_desde || "2025-10-01";
    let fechaHasta = fecha_hasta || "2026-12-31";

    // Validar formato de fechas solo si se proporcionan
    if (fecha_desde && !isValidDateFormat(fecha_desde)) {
      return res
        .status(400)
        .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
    }
    if (fecha_hasta && !isValidDateFormat(fecha_hasta)) {
      return res
        .status(400)
        .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
    }

    const yearDesde = new Date(fechaDesde).getFullYear();
    const yearHasta = new Date(fechaHasta).getFullYear();

    if (!isValidYear(yearDesde) || !isValidYear(yearHasta)) {
      return res.status(400).json({ error: "Año fuera del rango válido" });
    }

    let years = [];
    if (yearHasta - yearDesde > 1) {
      years = [yearHasta - 1, yearHasta];
    } else {
      for (let y = yearDesde; y <= yearHasta; y++) {
        years.push(y);
      }
    }

    const cacheKey = `${fechaDesde}-${fechaHasta}-${bodega || ""}-${asesor || ""}-${zona || ""}-${ciudad || ""}-${linea_venta || ""}-${agrupacion || ""}-${page}-${limit}`;
    const now = Date.now();
    const cached = ventasCache.get(cacheKey);
    if (cached && now - cached.time < VENTAS_CACHE_TTL) {
      return res.json(cached.data);
    }
    let whereBase = `WHERE v.fecdoc BETWEEN ? AND ?`;

    if (bodega) {
      whereBase += ` AND v.nombre_bodega = ?`;
    }

    if (asesor) {
      whereBase += ` AND v.nombre_vendedor = ?`;
    }

    if (ciudad) {
      whereBase += ` AND bod.ciudad = ?`;
    }
    if (zona) {
      whereBase += ` AND bod.zona = ?`;
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
        whereBase += ` AND gh.linea_venta = ?`;
      }
    }

    // Filtro por agrupación (mapeado)
    // "Indigo" → indigo, jeans
    // "Tela Liviana" → nacional, importado, tela liviana
    // "Calzado" → calzado
    // "Complemento" → accesorios
    if (agrupacion) {
      const agrupLower = agrupacion.toLowerCase();
      if (agrupLower === "indigo") {
        whereBase += ` AND LOWER(gr.agrupacion) IN ('indigo', 'jeans')`;
      } else if (agrupLower === "tela liviana") {
        whereBase += ` AND LOWER(gr.agrupacion) IN ('nacional', 'importado', 'tela liviana')`;
      } else if (agrupLower === "calzado") {
        whereBase += ` AND LOWER(gr.agrupacion) = 'calzado'`;
      } else if (agrupLower === "complemento") {
        whereBase += ` AND LOWER(gr.agrupacion) = 'accesorios'`;
      } else {
        // Filtro directo si no es uno de los mapeados
        whereBase += ` AND gr.agrupacion = ?`;
      }
    }

    // Función para generar parámetros por cada consulta
    const getQueryParams = () => {
      const queryParams = [fecha_desde, fecha_hasta];
      if (bodega) queryParams.push(bodega);
      if (asesor) queryParams.push(asesor);
      if (ciudad) queryParams.push(ciudad);
      if (zona) queryParams.push(zona);
      if (linea_venta) {
        const lineaLower = linea_venta.toLowerCase();
        if (
          lineaLower !== "colección" &&
          lineaLower !== "coleccion" &&
          lineaLower !== "básicos" &&
          lineaLower !== "basicos" &&
          lineaLower !== "promoción" &&
          lineaLower !== "promocion"
        ) {
          queryParams.push(linea_venta);
        }
      }
      if (agrupacion) {
        const agrupLower = agrupacion.toLowerCase();
        if (
          agrupLower !== "indigo" &&
          agrupLower !== "tela liviana" &&
          agrupLower !== "calzado" &&
          agrupLower !== "complemento"
        ) {
          queryParams.push(agrupacion);
        }
      }
      return queryParams;
    };

    const sqlParts = [];
    const params = [];

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
    // - "accesorios" → "Complemento"
    const agrupacionCase = `
      CASE 
        WHEN LOWER(gr.agrupacion) IN ('indigo', 'jeans') THEN 'Indigo'
        WHEN LOWER(gr.agrupacion) IN ('nacional', 'importado', 'tela liviana') THEN 'Tela Liviana'
        WHEN LOWER(gr.agrupacion) = 'calzado' THEN 'Calzado'
        WHEN LOWER(gr.agrupacion) = 'accesorios' THEN 'Complemento'
        WHEN gr.agrupacion IS NULL THEN 'Sin agrupación'
        ELSE gr.agrupacion
      END AS agrupacion
    `;

    // Ventas y devoluciones de kcn_db
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      sqlParts.push(`
        SELECT v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               ROUND(v.cantidad_venta, 0) AS venta, ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM kcn_db.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON TRIM(UPPER(v.nombre_bodega)) = TRIM(UPPER(bod.nombre))
          
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      params.push(...getQueryParams());

      sqlParts.push(`
        SELECT v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               -ROUND(v.cantidad, 0) AS venta, -ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM kcn_db.devoluciones_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON TRIM(UPPER(v.nombre_bodega)) = TRIM(UPPER(bod.nombre))
          
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      params.push(...getQueryParams());
    });

    // Ventas y devoluciones de naranka
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      sqlParts.push(`
        SELECT v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               ROUND(v.cantidad_venta, 0) AS venta, ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM naranka.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON TRIM(UPPER(v.nombre_bodega)) = TRIM(UPPER(bod.nombre))
          
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      params.push(...getQueryParams());

      sqlParts.push(`
        SELECT v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               -ROUND(v.cantidad, 0) AS venta, -ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM naranka.devoluciones_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON TRIM(UPPER(v.nombre_bodega)) = TRIM(UPPER(bod.nombre))
          
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      params.push(...getQueryParams());
    });

    const sqlFinal = sqlParts.join(" UNION ALL ");

    const connection = await getConnection();
    try {
      const pageNum = parseInt(String(page)) || 0;
      const limitNum = parseInt(String(limit)) || 10000;
      const offset = pageNum * limitNum;

      const paginatedSql = `${sqlFinal} LIMIT ${limitNum} OFFSET ${offset}`;
      const [rows] = await connection.execute(paginatedSql, params);

      ventasCache.set(cacheKey, { time: now, data: rows });

      if (ventasCache.size > 100) {
        const oldestKey = ventasCache.keys().next().value;
        ventasCache.delete(oldestKey);
      }

      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

module.exports = router;
