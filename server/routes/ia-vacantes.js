const express = require("express");
const router = express.Router();
const {
  createDirectus, rest, readItem, readItems, readUsers, updateItem, staticToken,
} = require("@directus/sdk");

const directus = createDirectus(process.env.DIRECTUS_URL)
  .with(staticToken(process.env.ADMIN_TOKEN))
  .with(rest());

// 🛑 CANDADO: Evita análisis duplicados del mismo candidato
const enProceso = new Set();

function extraerJson(texto) {
  let s = texto.trim();
  const bloque = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (bloque) s = bloque[1].trim();
  try { return JSON.parse(s); } catch { }
  const i = s.indexOf("{");
  const f = s.lastIndexOf("}");
  if (i !== -1 && f > i) {
    try { return JSON.parse(s.slice(i, f + 1)); } catch { }
  }
  throw new Error("JSON inválido");
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.post("/ia/vacantes/analizar", async (req, res) => {
  const { applicationId } = req.body;

  if (enProceso.has(applicationId)) {
    console.warn(`[IA] ⚠️ La postulación ${applicationId} ya está siendo analizada. Ignorando.`);
    return res.json({ ok: false, razon: "Ya está en proceso" });
  }

  enProceso.add(applicationId);
  console.log(`\n[IA] Analizando postulación ${applicationId}`);

  try {
    // ✅ USANDO ai_score
    const postulacion = await directus.request(
      readItem("app_applications", applicationId, {
        fields: ["id", "full_name", "city", "years_experience", "education_level", "cv", "ai_score"],
      })
    );

    console.log(`[IA] Candidato: ${postulacion.full_name}`);

    if (postulacion.ai_score != null) {
      console.log(`[IA] Ya analizado (${postulacion.ai_score}). Saltando.`);
      return res.json({ ok: true, yaExistia: true, puntaje: postulacion.ai_score });
    }
    if (!postulacion.cv) {
      return res.json({ ok: false, razon: "Sin CV" });
    }

    // Leer cargo
    let cargoNombre = "";
    let descripcionCargo = "Sin descripción específica.";

    try {
      const relaciones = await directus.request(
        readItems("app_applications_app_positions", {
          filter: { app_applications_id: { _eq: applicationId } },
          fields: ["app_positions_id"],
          limit: 1,
        })
      );

      if (relaciones[0]?.app_positions_id) {
        const cargo = await directus.request(
          readItem("app_positions", relaciones[0].app_positions_id, {
            fields: ["id", "nombre", "descripcion"],
          })
        );
        cargoNombre = cargo?.nombre || "";
        descripcionCargo = cargo?.descripcion || descripcionCargo;
        console.log(`[IA] Cargo: "${cargoNombre}"`);
      }
    } catch (err) {
      console.warn(`[IA] Error leyendo cargo: ${err.message}`);
    }

    // Descargar PDF
    console.log(`[IA] Descargando CV...`);
    const directusUrl = process.env.DIRECTUS_URL || "http://192.168.19.245:8055";
    const token = process.env.ADMIN_TOKEN;

    const pdfRes = await fetch(`${directusUrl}/assets/${postulacion.cv}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!pdfRes.ok) throw new Error(`PDF HTTP ${pdfRes.status}`);

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const pdfBase64 = pdfBuffer.toString("base64");
    console.log(`[IA] CV: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    // API Key y modelos
    const usuarios = await directus.request(
      readUsers({ fields: ["ia_key", "models_ia.name"], limit: 100 })
    );
    const usuario = usuarios.find((u) => u.ia_key);
    if (!usuario) throw new Error("Ningún usuario tiene ia_key");

    const apiKey = usuario.ia_key;
    let MODELOS = (usuario.models_ia || [])
      .map((m) => (typeof m === "string" ? m : m?.name))
      .filter(Boolean);

    if (MODELOS.length === 0) {
      MODELOS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
      console.warn(`[IA] Sin models_ia en Directus. Usando Fallback.`);
    }

    // Prompt
    const prompt = `Eres un reclutador de KanCan, marca colombiana de jeans.
CARGO: "${cargoNombre}"
DESCRIPCIÓN DEL CARGO:
"""
${descripcionCargo}
"""
CANDIDATO:
- Nombre: ${postulacion.full_name}
- Ciudad: ${postulacion.city}
- Experiencia: ${postulacion.years_experience} años
- Educación: ${postulacion.education_level || "No especificada"}
Analiza el CV adjunto (PDF). Compara CADA función con lo que dice el CV.
Devuelve SOLO este JSON (sin texto extra):
{
  "puntaje": número 0-100,
  "fortalezas": ["3 puntos específicos"],
  "aVerificar": ["2-3 funciones que NO se ven"],
  "resumen": "1 frase sobre el candidato"
}`;

    const responseSchema = {
      type: "object",
      properties: {
        puntaje: { type: "number" },
        fortalezas: { type: "array", items: { type: "string" } },
        aVerificar: { type: "array", items: { type: "string" } },
        resumen: { type: "string" }
      },
      required: ["puntaje", "fortalezas", "aVerificar", "resumen"]
    };

    // Bucle de modelos
    let resultado = null;
    let modeloUsado = "";

    for (const modelo of MODELOS) {
      console.log(`[IA] Probando ${modelo}...`);
      let exitoModelo = false;
      let textoResp = "";

      for (let intento = 1; intento <= 3; intento++) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "application/pdf", data: pdfBase64 } }] }],
                generationConfig: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0 },
              }),
            }
          );

          if (r.status === 503 || r.status === 429) throw new Error("Saturado");
          if (!r.ok) throw new Error(`Error HTTP ${r.status}`);

          const data = await r.json();
          textoResp = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (textoResp) { exitoModelo = true; break; }
        } catch (err) {
          if (intento < 3) {
            const esperaMs = Math.pow(2, intento) * 1000;
            console.warn(`[IA] ${modelo} falló. Reintentando en ${esperaMs / 1000}s...`);
            await esperar(esperaMs);
          }
        }
      }

      if (exitoModelo && textoResp) {
        try {
          const parsed = extraerJson(textoResp);
          if (typeof parsed.puntaje === "number") {
            resultado = parsed;
            modeloUsado = modelo;
            break;
          }
        } catch { }
      }
    }

    if (!resultado) throw new Error("Todos los modelos fallaron");

    // ✅ GUARDANDO CON ai_score
    await directus.request(
      updateItem("app_applications", applicationId, {
        ai_score: resultado.puntaje, 
        ai_analysis: JSON.stringify({
          puntaje: resultado.puntaje,
          fortalezas: resultado.fortalezas || [],
          aVerificar: resultado.aVerificar || [],
          resumen: resultado.resumen || "",
          cargo: cargoNombre,
          fecha: new Date().toISOString(),
          modelo: modeloUsado,
          auto: true,
        }),
      })
    );

    console.log(`[IA] ✅ Guardado: ${resultado.puntaje} pts (${modeloUsado})\n`);
    res.json({ ok: true, puntaje: resultado.puntaje, modelo: modeloUsado });
    
  } catch (err) {
    console.error(`[IA] ❌ ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    enProceso.delete(applicationId);
  }
});

module.exports = router;