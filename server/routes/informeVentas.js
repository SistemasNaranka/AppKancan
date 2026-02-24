const express = require("express");
const router = express.Router();
const { getConnection, queryDB } = require("../utils/db");
const { isValidDateFormat, isValidYear } = require("../utils/validators");
const { verifyDirectusToken } = require("../middleware/auth");

// ==================== ENDPOINTS DE FILTROS ====================

/**
 * GET /api/zonas
 * Obtener zonas únicas desde las ventas (JOIN con kancan.bodegas)
 * Acepta parámetros de fecha: fecha_desde, fecha_hasta
 * 🔒 PROTEGIDO: Requiere autenticación
 */
router.get("/zonas", verifyDirectusToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    // Validar fechas si se proporcionan
    let years;
    if (fecha_desde && fecha_hasta) {
      // Validar formato de fechas
      if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }
      const yearDesde = new Date(fecha_desde).getFullYear();
      const yearHasta = new Date(fecha_hasta).getFullYear();

      // Validar años
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

    // Construir consulta UNION con parámetros preparados
    const sqlParts = [];
    const params = [];

    // kcn_db.ventas
    years.forEach((year) => {
      // Validar que el año sea un número entero seguro
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 20 AND bod.zona IS NOT NULL AND bod.zona != ''`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }
      sqlParts.push(`
        SELECT DISTINCT bod.zona AS nombre 
        FROM kcn_db.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        WHERE ${whereClause}
      `);
    });

    // naranka.ventas
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 40 AND bod.zona IS NOT NULL AND bod.zona != ''`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }
      sqlParts.push(`
        SELECT DISTINCT bod.zona AS nombre 
        FROM naranka.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        WHERE ${whereClause}
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ") + " ORDER BY nombre";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal, params);

      // Eliminar duplicados
      const zonasMap = new Map();
      rows.forEach((row) => {
        if (row.nombre) {
          zonasMap.set(row.nombre, row.nombre);
        }
      });

      const zonas = Array.from(zonasMap.values()).sort();
      res.json(zonas.map((nombre) => ({ nombre })));
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
 * Acepta parámetros de fecha: fecha_desde, fecha_hasta
 * 🔒 PROTEGIDO: Requiere autenticación
 */
router.get("/ciudades", verifyDirectusToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    // Validar fechas si se proporcionan
    let years;
    if (fecha_desde && fecha_hasta) {
      // Validar formato de fechas
      if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }
      const yearDesde = new Date(fecha_desde).getFullYear();
      const yearHasta = new Date(fecha_hasta).getFullYear();

      // Validar años
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

    // Construir consulta UNION con parámetros preparados
    const sqlParts = [];
    const params = [];

    // kcn_db.ventas
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 20 AND bod.ciudad IS NOT NULL AND bod.ciudad != ''`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }
      sqlParts.push(`
        SELECT DISTINCT bod.ciudad AS nombre 
        FROM kcn_db.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        WHERE ${whereClause}
      `);
    });

    // naranka.ventas
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 40 AND bod.ciudad IS NOT NULL AND bod.ciudad != ''`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }
      sqlParts.push(`
        SELECT DISTINCT bod.ciudad AS nombre 
        FROM naranka.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        WHERE ${whereClause}
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ") + " ORDER BY nombre";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal, params);

      // Eliminar duplicados
      const ciudadesMap = new Map();
      rows.forEach((row) => {
        if (row.nombre) {
          ciudadesMap.set(row.nombre, row.nombre);
        }
      });

      const ciudades = Array.from(ciudadesMap.values()).sort();
      res.json(ciudades.map((nombre) => ({ nombre })));
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
 * Obtener tiendas/bodegas desde las ventas (no desde tabla bodegas)
 * Obtiene nombre_bodega de las tablas de ventas y hace JOIN con kancan.bodegas para ciudad y zona
 * Acepta parámetros de fecha: fecha_desde, fecha_hasta
 * 🔒 PROTEGIDO: Requiere autenticación
 */
router.get("/tiendas", verifyDirectusToken, async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    // Validar fechas si se proporcionan
    let years;
    if (fecha_desde && fecha_hasta) {
      // Validar formato de fechas
      if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }
      const yearDesde = new Date(fecha_desde).getFullYear();
      const yearHasta = new Date(fecha_hasta).getFullYear();

      // Validar años
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

    // Construir consulta UNION con parámetros preparados
    const sqlParts = [];
    const params = [];

    // kcn_db.ventas (bodega BETWEEN 3 AND 20)
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 20`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }
      sqlParts.push(`
        SELECT DISTINCT 
          v.bodega AS id, 
          v.nombre_bodega AS nombre, 
          bod.ciudad, 
          bod.zona
        FROM kcn_db.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        WHERE ${whereClause}
      `);
    });

    // naranka.ventas (bodega BETWEEN 3 AND 40)
    years.forEach((year) => {
      const safeYear = Math.floor(year);
      if (!isValidYear(safeYear)) return;

      let whereClause = `v.bodega BETWEEN 3 AND 40`;
      if (fecha_desde && fecha_hasta) {
        whereClause += ` AND v.fecdoc BETWEEN ? AND ?`;
        params.push(fecha_desde, fecha_hasta);
      }
      sqlParts.push(`
        SELECT DISTINCT 
          v.bodega AS id, 
          v.nombre_bodega AS nombre, 
          bod.ciudad, 
          bod.zona
        FROM naranka.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        WHERE ${whereClause}
      `);
    });

    const sqlFinal = sqlParts.join(" UNION ") + " ORDER BY nombre";

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(sqlFinal, params);

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
 * 🔒 PROTEGIDO: Requiere autenticación
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
 * 🔒 PROTEGIDO: Requiere autenticación
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
 * Los 7 valores de BD se mapean a 4 grupos:
 * - Indigo: indigo, jeans
 * - Tela Liviana: nacional, importado, tela liviana
 * - Calzado: calzado
 * - Complemento: complemento
 * 🔒 PROTEGIDO: Requiere autenticación
 */
router.get("/agrupaciones", verifyDirectusToken, async (req, res) => {
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
 * 🔒 PROTEGIDO: Requiere autenticación
 */
router.get("/lineas-venta", verifyDirectusToken, async (req, res) => {
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
 * 🔒 PROTEGIDO: Requiere autenticación
 */
router.get("/asesores", verifyDirectusToken, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear];

    // Validar años
    const safeYears = years.filter((y) => isValidYear(y));
    if (safeYears.length === 0) {
      return res.status(400).json({ error: "Años inválidos" });
    }

    const sqlKcn = safeYears
      .map(
        (year) => `
      SELECT DISTINCT nombre_vendedor 
      FROM kcn_db.ventas_${year}
      WHERE nombre_vendedor IS NOT NULL AND nombre_vendedor != ''
    `,
      )
      .join(" UNION ");

    const sqlNaranka = safeYears
      .map(
        (year) => `
      SELECT DISTINCT nombre_vendedor 
      FROM naranka.ventas_${year}
      WHERE nombre_vendedor IS NOT NULL AND nombre_vendedor != ''
    `,
      )
      .join(" UNION ");

    const sqlFinal = `${sqlKcn} UNION ${sqlNaranka}`;

    const connection = await getConnection();
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

// ==================== ENDPOINT PRINCIPAL DE VENTAS ====================

/**
 * GET /api/ventas
 * Obtener ventas con filtros, incluyendo línea de venta, agrupación, ciudad y zona
 * La zona y ciudad vienen directamente de la tabla bodegas
 * 🔒 PROTEGIDO: Requiere autenticación con token de Directus
 */
router.get("/ventas", verifyDirectusToken, async (req, res) => {
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

    // Validar formato de fechas
    if (!isValidDateFormat(fecha_desde) || !isValidDateFormat(fecha_hasta)) {
      return res
        .status(400)
        .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
    }

    const yearDesde = new Date(fecha_desde).getFullYear();
    const yearHasta = new Date(fecha_hasta).getFullYear();

    // Validar años
    if (!isValidYear(yearDesde) || !isValidYear(yearHasta)) {
      return res.status(400).json({ error: "Año fuera del rango válido" });
    }

    const years = [];
    for (let y = yearDesde; y <= yearHasta; y++) {
      years.push(y);
    }

    // Construir condiciones WHERE (sin parámetros, se agregarán por cada consulta)
    let whereBase = `WHERE v.fecdoc BETWEEN ? AND ?`;

    if (bodega) {
      whereBase += ` AND v.nombre_bodega = ?`;
    }

    if (asesor) {
      whereBase += ` AND v.nombre_vendedor = ?`;
    }

    // Filtro por ciudad (directamente de bodegas)
    if (ciudad) {
      whereBase += ` AND bod.ciudad = ?`;
    }

    // Filtro por zona (directamente de bodegas)
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
        // Filtro directo si no es uno de los mapeados
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

    // Consultas para cada año con JOIN a bodegas, referencias, grupos_homogeneos y grupos
    // Mapeo de líneas de venta y agrupaciones según reglas de negocio
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
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               ROUND(v.cantidad_venta, 0) AS venta, ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM kcn_db.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      params.push(...getQueryParams());

      sqlParts.push(`
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               -ROUND(v.cantidad, 0) AS venta, -ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM kcn_db.devoluciones_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
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
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               ROUND(v.cantidad_venta, 0) AS venta, ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM naranka.ventas_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
        LEFT JOIN naranka.referencias r ON v.codigo_referencia = r.referencia
        LEFT JOIN naranka.grupos_homogeneos gh ON r.codigo_homogeneo = gh.id
        LEFT JOIN naranka.grupos gr ON gh.id_grupo = gr.id
        ${whereBase} AND v.bodega BETWEEN 3 AND 40
      `);
      params.push(...getQueryParams());

      sqlParts.push(`
        SELECT v.codigo_referencia, v.documentos, v.fecdoc, v.nombre_vendedor, v.nombre_bodega,
               -ROUND(v.cantidad, 0) AS venta, -ROUND(v.total_factura, 0) AS valor,
               ${lineaVentaCase},
               ${agrupacionCase},
               COALESCE(bod.ciudad, 'Sin ciudad') AS ciudad,
               COALESCE(bod.zona, 'Sin zona') AS zona
        FROM naranka.devoluciones_${safeYear} v
        LEFT JOIN kancan.bodegas bod ON v.bodega = bod.id
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
      const [rows] = await connection.execute(sqlFinal, params);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// ==================== ENDPOINTS DE DEBUG ====================

/**
 * GET /api/debug/agrupaciones-reales
 * Endpoint de debug para ver qué valores de agrupación existen en la BD
 * 🔒 PROTEGIDO: Requiere autenticación (solo para desarrollo/debug)
 */
router.get(
  "/debug/agrupaciones-reales",
  verifyDirectusToken,
  async (req, res) => {
    try {
      const sql = `
      SELECT DISTINCT gr.agrupacion, COUNT(*) as total
      FROM naranka.grupos gr
      GROUP BY gr.agrupacion
      ORDER BY total DESC
    `;
      const rows = await queryDB("naranka", sql);
      res.json(rows);
    } catch (error) {
      console.error("Error al obtener agrupaciones reales:", error);
      res.status(500).json({ error: "Error al obtener agrupaciones reales" });
    }
  },
);

module.exports = router;
