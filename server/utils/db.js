/**
 * Utilidades de base de datos
 * Maneja el pool de conexiones MySQL y consultas
 */

const mysql = require("mysql2/promise");

// Configuración de la base de datos MySQL
const dbConfig = {
  host: process.env.DB_HOST || "192.168",
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

/**
 * Ejecuta una consulta en una base de datos específica
 * @param {string} database - Nombre de la base de datos
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Array>} - Resultados de la consulta
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

/**
 * Obtiene una conexión del pool
 * @returns {Promise<Connection>} - Conexión MySQL
 */
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  queryDB,
  getConnection,
  dbConfig,
};
