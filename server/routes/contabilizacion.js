const express = require("express");
const router = express.Router();
const fetch = require("node-fetch").default || require("node-fetch");
const { verifyDirectusToken } = require("../middleware/auth");

/**
 * POST /api/contabilizacion/extraer
 * Proxies Gemini requests to Google's API, keeping the API Key secure.
 * PROTECTED: Requires valid Directus Token.
 */
router.post(["/contabilizacion/extraer", "/ia/gemini/extraer"], verifyDirectusToken, async (req, res) => {
  try {
    const { model, contents } = req.body;

    if (!model) {
      return res.status(400).json({ error: "El modelo es requerido" });
    }
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "El campo contents es requerido y debe ser un array" });
    }

    const apiKey = req.user?.ia_key;
    if (!apiKey) {
      return res.status(400).json({
        error: "Clave de API faltante",
        message: "No tienes una clave de API de Gemini configurada en tu cuenta de usuario. Configúrala en tu perfil de Directus antes de continuar."
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error de Gemini API (Status ${response.status}):`, errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: { message: errorText } };
      }

      return res.status(response.status).json({
        error: "Error en la API de Gemini",
        message: errorJson.error?.message || "Error al procesar la factura con Gemini",
        details: errorJson,
      });
    }

    const data = await response.json();
    
    // Extraer el texto generado de la respuesta de Gemini
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Respuesta inesperada de Gemini:", JSON.stringify(data));
      return res.status(500).json({
        error: "Formato inesperado",
        message: "La respuesta de la API de Gemini no contiene el texto esperado.",
        details: data,
      });
    }

    res.json({ text });
  } catch (error) {
    console.error("Error al proxyar petición a Gemini:", error);
    res.status(500).json({
      error: "Error interno",
      message: "Ocurrió un error interno en el servidor al intentar comunicarse con Gemini: " + error.message
    });
  }
});

module.exports = router;
