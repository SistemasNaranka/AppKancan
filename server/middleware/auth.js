/**
 * Middleware de autenticación para verificar tokens de Directus
 * Protege los endpoints de la API verificando que el usuario esté autenticado
 */

const fetch = require("node-fetch").default || require("node-fetch");

// URL de Directus para verificación de tokens
const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";

/**
 * Middleware para verificar el token de Directus
 * Protege los endpoints de la API verificando que el usuario esté autenticado
 */
async function verifyDirectusToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No autorizado",
        message: "Se requiere token de autenticación",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verificar el token contra Directus
    const response = await fetch(`${DIRECTUS_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(401).json({
        error: "Token inválido",
        message: "El token de autenticación no es válido o ha expirado",
      });
    }

    const userData = await response.json();

    // Agregar información del usuario al request para uso posterior
    req.user = userData.data;

    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(500).json({
      error: "Error de autenticación",
      message: "Error al verificar el token de autenticación",
    });
  }
}

/**
 * Middleware opcional para verificar roles específicos
 * @param {string[]} allowedRoles - Array de roles permitidos
 */
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "No autorizado",
        message: "Usuario no autenticado",
      });
    }

    const userRole = req.user.role?.name;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "No tienes permisos para acceder a este recurso",
      });
    }

    next();
  };
}

module.exports = {
  verifyDirectusToken,
  requireRoles,
};
