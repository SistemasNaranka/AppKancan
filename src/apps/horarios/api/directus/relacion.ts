// Módulo propio para que read.ts y readBulk.ts lo usen sin importarse entre sí.
/** Id de una relación M2O de Directus, venga como objeto `{ id }` o como valor plano. */
export const idRelacion = (val: unknown): number | null => {
	const raw =
		val != null && typeof val === 'object' ? (val as { id?: unknown }).id : val;
	// Number(null) y Number('') dan 0: una relación vacía no es el id 0.
	if (raw == null || raw === '') return null;
	const num = Number(raw);
	return Number.isFinite(num) ? num : null;
};
