import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { updateItem } from '@directus/sdk';

export async function updateApplicationStatus(
  id: number,
  status: string
): Promise<void> {
  try {
    await withAutoRefresh(() =>
      directus.request(
        updateItem('app_applications' as never, id, { status } as never)
      )
    );
  } catch (error) {
    console.error('❌ Error actualizando status:', error);
    throw error;
  }
}

// ============================================================
// GUARDA AUTOMÁTICAMENTE el análisis de IA en Directus
// ============================================================
export async function guardarAnalisisIA(
  id: number,
  puntaje: number,
  analisis: {
    fortalezas: string[];
    aVerificar: string[];
    resumen: string;
    cargo: string;
    modelo?: string;
  }
): Promise<void> {
  try {
    console.log(`[IA] 💾 Guardando análisis (candidato ${id}, puntaje ${puntaje})`);

    const analisisString = JSON.stringify({
      puntaje,
      fortalezas: analisis.fortalezas,
      aVerificar: analisis.aVerificar,
      resumen: analisis.resumen,
      cargo: analisis.cargo,
      fecha: new Date().toISOString(),
      modelo: analisis.modelo,
    });

    await withAutoRefresh(() =>
      directus.request(
        updateItem('app_applications' as never, id, {
          ia_score: puntaje,
          ai_analysis: analisisString,
        } as never)
      )
    );

    console.log(`[IA] ✅ Guardado en Directus (candidato ${id})`);
  } catch (error: any) {
    console.error(`[IA] ❌ Error al guardar candidato ${id}:`, error);
    throw error;
  }
}