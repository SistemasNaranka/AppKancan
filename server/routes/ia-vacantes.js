const express = require("express");
const router = express.Router();
const {
  createDirectus, rest, readItem, readUsers, updateItem, staticToken,
} = require("@directus/sdk");

const directus = createDirectus(process.env.DIRECTUS_URL)
  .with(staticToken(process.env.DIRECTUS_ADMIN_TOKEN))
  .with(rest());

// CANDADO: Evita análisis duplicados
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
    console.warn(`[IA] ⚠️ La postulación ${applicationId} ya está en proceso. Ignorando.`);
    return res.json({ ok: false, razon: "Ya está en proceso" });
  }

  enProceso.add(applicationId);
  console.log(`\n[IA] Analizando postulación ${applicationId}`);

  try {
    // ✅ 1. Consulta anidada usando 'descripcion' en minúscula (exacto a tu Directus)
    const postulacion = await directus.request(
      readItem("app_applications", applicationId, {
        fields: [
          "id", "full_name", "city", "years_experience", "education_level", "cv", "ai_score",
          "positions.app_positions_id.nombre",
          "positions.app_positions_id.descripcion"
        ],
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

    // 2. Extraer Cargo y Descripción
    const posData = postulacion.positions?.[0]?.app_positions_id;
    const cargoNombre = posData?.nombre || "No especificado";
    const descripcionCargo = posData?.descripcion || "Sin descripción específica.";

    console.log(`[IA] Cargo: "${cargoNombre}"`);
    console.log(`[IA] Descripción cargada: "${descripcionCargo.slice(0, 50)}..."`);

    // 3. Descargar PDF
    console.log(`[IA] Descargando CV...`);
    const directusUrl = process.env.DIRECTUS_URL || "http://192.168.19.245:8055";
    const token = process.env.DIRECTUS_ADMIN_TOKEN;

    const pdfRes = await fetch(`${directusUrl}/assets/${postulacion.cv}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!pdfRes.ok) throw new Error(`PDF HTTP ${pdfRes.status}`);

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const pdfBase64 = pdfBuffer.toString("base64");
    console.log(`[IA] CV: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    // 4. API Key y Modelos
    const usuarios = await directus.request(
      readUsers({ fields: ["ia_key", "models_ia.name"], limit: 100 })
    );
    const usuario = usuarios.find((u) => u.ia_key);
    if (!usuario) throw new Error("Ningún usuario tiene ia_key");

    const apiKey = usuario.ia_key;
    let MODELOS = (usuario.models_ia || [])
      .map((m) => (typeof m === "string" ? m : m?.name))
      .filter(Boolean);
    // ✅ Agregamos el 3.1-flash-lite al final como último salvavidas
    if (MODELOS.length === 0) {
      MODELOS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
      console.warn(`[IA] Sin models_ia en Directus. Usando Fallback.`);
    }

    // ✅ 6. PROMPT ROBUSTO (Obliga a la IA a hacer el desglose matemático)
    const prompt = `Actúa como un Analista de Talento Humano experto, estricto y objetivo para KanCan.

CARGO A EVALUAR: "${cargoNombre}"

REQUISITOS DEL CARGO (Directus):
"""
${descripcionCargo}
"""

CANDIDATO:
- Nombre: ${postulacion.full_name}
- Experiencia declarada: ${postulacion.years_experience} años
- Educación: ${postulacion.education_level || "No especificada"}

INSTRUCCIONES DE EVALUACIÓN (No te desvíes de esto):
Para calcular el puntaje, DEBES llenar el "desglose" sumando estos 4 criterios:
1. Experiencia en el cargo exacto (0 a 40 pts). Basado en lo que pide la descripción.
2. Experiencia en Retail/Moda/Ventas (0 a 25 pts).
3. Habilidades técnicas clave: caja, inventario, atención al cliente (0 a 25 pts).
4. Formación académica relacionada (0 a 10 pts).

REGLAS ESTRICTAS E INQUEBRANTABLES:
- NO INVENTES información. Si el CV no menciona algo, NO lo asumas.
- Si el candidato tiene 0 años de experiencia en ventas/retail, el puntaje final NO puede superar los 45 puntos.
- La media real de un candidato promedio es 50-65. Solo un candidato excepcional (con experiencia y formación exacta) supera los 80.
- El "puntaje" final DEBE ser la suma matemática exacta de los 4 puntos del desglose.
- El "resumen" debe tener máximo 2 frases.

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin saludos, sin bloques de código):
{
  "desglose": {
    "experiencia_cargo": 0,
    "experiencia_retail": 0,
    "habilidades_tecnicas": 0,
    "formacion": 0
  },
  "puntaje": 0,
  "fortalezas": ["3 puntos específicos del CV"],
  "aVerificar": ["2-3 funciones del cargo que NO se ven en el CV"],
  "resumen": "1 frase sobre el candidato frente al cargo"
}`;

    const responseSchema = {
      type: "object",
      properties: {
        desglose: {
          type: "object",
          properties: {
            experiencia_cargo: { type: "number" },
            experiencia_retail: { type: "number" },
            habilidades_tecnicas: { type: "number" },
            formacion: { type: "number" }
          },
          required: ["experiencia_cargo", "experiencia_retail", "habilidades_tecnicas", "formacion"]
        },
        puntaje: { type: "number" },
        fortalezas: { type: "array", items: { type: "string" } },
        aVerificar: { type: "array", items: { type: "string" } },
        resumen: { type: "string" }
      },
      required: ["desglose", "puntaje", "fortalezas", "aVerificar", "resumen"]
    };

    // 7. Bucle de modelos con reintentos
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
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: responseSchema,
                  temperature: 0.1 // Temperatura baja para que no invente
                },
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

    // 8. Guardar en Directus
    await directus.request(
      updateItem("app_applications", applicationId, {
        ai_score: resultado.puntaje,
        ai_analysis: JSON.stringify({
          puntaje: resultado.puntaje,
          desglose: resultado.desglose,
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