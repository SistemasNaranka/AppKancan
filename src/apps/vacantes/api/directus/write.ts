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