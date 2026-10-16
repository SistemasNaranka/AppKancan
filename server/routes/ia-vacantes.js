const express = require("express");
const router = express.Router();
const {
  createDirectus, rest, readItem, readItems, readUsers, updateItem, staticToken,
} = require("@directus/sdk");

const directus = createDirectus(process.env.DIRECTUS_URL)
  .with(staticToken(process.env.ADMIN_TOKEN))
  .with(rest());

// ============================================================
// Helpers
// ============================================================
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

// ============================================================
// POST /api/ia/vacantes/analizar
// ============================================================
router.post("/ia/vacantes/analizar", async (req, res) => {
  const { applicationId } = req.body;
  console.log(`\n[IA] Analizando postulación ${applicationId}`);

  try {
    // 1. Postulación
    const postulacion = await directus.request(
      readItem("app_applications", applicationId, {
        fields: ["id", "full_name", "city", "years_experience", "education_level", "cv", "ia_score"],
      })
    );

    console.log(`[IA] Candidato: ${postulacion.full_name}`);

    if (postulacion.ia_score != null) {
      console.log(`[IA] Ya analizado (${postulacion.ia_score}). Saltando.`);
      return res.json({ ok: true, yaExistia: true, puntaje: postulacion.ia_score });
    }
    if (!postulacion.cv) {
      return res.json({ ok: false, razon: "Sin CV" });
    }

    // 2. Leer el cargo Y su descripción desde la tabla M2M
    let cargoNombre = "";
    let descripcionCargo = "Sin descripción específica.";

    try {
      // Buscar la relación
      const relaciones = await directus.request(
        readItems("app_applications_app_positions", {
          filter: { app_applications_id: { _eq: applicationId } },
          fields: ["app_positions_id"],
          limit: 1,
        })
      );

      if (relaciones[0]?.app_positions_id) {
        // Leer el cargo completo (nombre + descripción)
        const cargo = await directus.request(
          readItem("app_positions", relaciones[0].app_positions_id, {
            fields: ["id", "nombre", "descripcion"],
          })
        );
        cargoNombre = cargo?.nombre || "";
        descripcionCargo = cargo?.descripcion || descripcionCargo;
        console.log(`[IA] Cargo: "${cargoNombre}"`);
        console.log(`[IA] Descripción: ${descripcionCargo.slice(0, 80)}...`);
      } else {
        console.log(`[IA] Sin cargo asignado`);
      }
    } catch (err) {
      console.warn(`[IA] Error leyendo cargo: ${err.message}`);
    }

    // 3. Descargar PDF
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

    // 4. API Key + modelos del usuario admin
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
      MODELOS = ["gemini-3.7-flash", "gemini-3.5-flash", "gemma-4-31b-it"];
      console.warn(`[IA] Sin models_ia. Fallback: ${MODELOS.join(", ")}`);
    } else {
      console.log(`[IA] Modelos: ${MODELOS.join(", ")}`);
    }

    // 5. Prompt que COMPARA el CV con la descripción del cargo
    const prompt = `Eres un reclutador de KanCan, marca colombiana de jeans.

CARGO: "${cargoNombre}"

DESCRIPCIÓN DEL CARGO (funciones y requisitos que busca la empresa):
"""
${descripcionCargo}
"""

CANDIDATO:
- Nombre: ${postulacion.full_name}
- Ciudad: ${postulacion.city}
- Experiencia: ${postulacion.years_experience} años
- Educación: ${postulacion.education_level || "No especificada"}

Analiza el CV adjunto (PDF). Compara CADA función de la descripción con lo que dice el CV del candidato.

Devuelve SOLO este JSON (sin texto extra):
{
  "puntaje": número 0-100,
  "fortalezas": ["3 puntos específicos del CV que coinciden con la descripción"],
  "aVerificar": ["2-3 funciones de la descripción que NO se ven en el CV"],
  "resumen": "1 frase sobre el candidato frente al cargo"
}`;

    // 6. Probar cada modelo
    let resultado = null;
    let modeloUsado = "";

    for (const modelo of MODELOS) {
      console.log(`[IA] Probando ${modelo}...`);
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
                ],
              }],
              generationConfig: { responseMimeType: "application/json", temperature: 0 },
            }),
          }
        );

        if (r.status === 503) { console.warn(`[IA] ${modelo} saturado`); continue; }
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          console.warn(`[IA] ${modelo} error ${r.status}: ${err?.error?.message || ""}`);
          continue;
        }

        const data = await r.json();
        const textoResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textoResp) continue;

        try {
          const parsed = extraerJson(textoResp);
          if (typeof parsed.puntaje === "number") {
            resultado = parsed;
            modeloUsado = modelo;
            console.log(`[IA] ✅ ${modelo} respondió`);
            break;
          }
        } catch {
          console.warn(`[IA] ${modelo} JSON inválido`);
          continue;
        }
      } catch (err) {
        console.warn(`[IA] ${modelo}: ${err.message}`);
        continue;
      }
    }

    if (!resultado) throw new Error("Todos los modelos fallaron");

    // 7. Guardar
    await directus.request(
      updateItem("app_applications", applicationId, {
        ia_score: resultado.puntaje,
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
  }
});

// ============================================================
// POST /api/ia/vacantes/analizar-masivo
// ============================================================
router.post("/ia/vacantes/analizar-masivo", async (req, res) => {
  const limite = Number(req.body?.limite) || 10;
  console.log(`\n[IA MASIVO] Procesando hasta ${limite}`);

  try {
    const pendientes = await directus.request(
      readItems("app_applications", {
        filter: { ia_score: { _null: true }, cv: { _nnull: true } },
        fields: ["id", "full_name"],
        limit: limite,
      })
    );

    console.log(`[IA MASIVO] ${pendientes.length} pendientes`);
    if (pendientes.length === 0) {
      return res.json({ ok: true, total: 0, exitosos: 0 });
    }

    const resultados = [];
    const PORT = process.env.PORT || 11000;

    for (const p of pendientes) {
      try {
        const r = await fetch(`http://localhost:${PORT}/api/ia/vacantes/analizar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: p.id }),
        });
        const data = await r.json();
        resultados.push({ id: p.id, ok: data.ok, puntaje: data.puntaje });
        console.log(`[IA MASIVO] ${p.full_name}: ${data.ok ? `✅ ${data.puntaje}` : `⚠️ ${data.error}`}`);
      } catch (err) {
        resultados.push({ id: p.id, ok: false, error: err.message });
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    const exitosos = resultados.filter((r) => r.ok).length;
    console.log(`[IA MASIVO] ${exitosos}/${pendientes.length} exitosos\n`);
    res.json({ ok: true, total: pendientes.length, exitosos, resultados });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// GET /api/ia/vacantes/pendientes
// ============================================================
router.get("/ia/vacantes/pendientes", async (_req, res) => {
  try {
    const pendientes = await directus.request(
      readItems("app_applications", {
        filter: { ia_score: { _null: true }, cv: { _nnull: true } },
        fields: ["id", "full_name"],
        limit: 500,
      })
    );
    res.json({ ok: true, total: pendientes.length, pendientes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;