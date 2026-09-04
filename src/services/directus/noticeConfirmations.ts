import directus from "@/services/directus/directus";
import { withAutoRefresh } from "@/auth/services/directusInterceptor";
import { readItems, createItem } from "@directus/sdk";

export const NOTICE_COLLECTION = "core_notice_confirmations";
export const NOTICE_CODE_ULTRA_RESTORED = "";

/**
 * Consulta EXCLUSIVAMENTE en la base de datos (Directus) si el usuario ya aceptó la notificación
 */
export async function hasUserAcceptedNotice(
  userId: string,
  noticeCode: string = NOTICE_CODE_ULTRA_RESTORED,
): Promise<boolean> {
  if (!noticeCode) return true; // Si no hay código de aviso configurado, asumir que no requiere aviso
  try {
    const items = await withAutoRefresh(() =>
      directus.request(
        readItems(NOTICE_COLLECTION as any, {
          filter: {
            user_id: { _eq: userId },
            notice_code: { _eq: noticeCode },
            accepted: { _eq: true },
          },
          limit: 1,
        }),
      ),
    );
    return Array.isArray(items) && items.length > 0;
  } catch (error) {
    console.error("❌ [Avisos] Error al verificar confirmación en BD:", error);
    return false;
  }
}

/**
 * Registra EXCLUSIVAMENTE en la base de datos (Directus) que el usuario aceptó la notificación
 */
export async function saveUserNoticeAcceptance(
  userId: string,
  noticeCode: string = NOTICE_CODE_ULTRA_RESTORED,
): Promise<boolean> {
  try {
    await withAutoRefresh(() =>
      directus.request(
        createItem(NOTICE_COLLECTION as any, {
          user_id: userId,
          notice_code: noticeCode,
          accepted: true,
          accepted_at: new Date().toISOString(),
        }),
      ),
    );
    return true;
  } catch (error) {
    console.error("❌ [Avisos] Error al guardar confirmación en la BD:", error);
    return false;
  }
}
