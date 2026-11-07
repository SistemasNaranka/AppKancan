import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('@/services/directus/directus', () => ({
	default: { request: (q: unknown) => request(q) },
}));
vi.mock('@/auth/services/directusInterceptor', () => ({
	withAutoRefresh: (fn: () => unknown) => fn(),
}));
vi.mock('@directus/sdk', () => ({
	aggregate: (c: string, o: unknown) => ({ op: 'aggregate', c, o }),
	createItem: (c: string, d: unknown) => ({ op: 'create', c, d }),
	updateItem: (c: string, id: number, d: unknown) => ({
		op: 'update',
		c,
		id,
		d,
	}),
	deleteItem: (c: string, id: number) => ({ op: 'delete', c, id }),
	readItems: (c: string, q: unknown) => ({ op: 'read', c, q }),
}));

import {
	actualizarMotivo,
	crearMotivo,
	listarMotivos,
	usosDeMotivos,
} from '@/apps/horarios/api/directus/motivos';

beforeEach(() => request.mockReset());

describe('motivos (Admin)', () => {
	it('lee is_system y el tipo en inglés (request/decline) o en español', async () => {
		request.mockResolvedValueOnce([
			{ id: 1, name: 'Otros', type: 'solicitud', is_system: true },
		]);
		expect((await listarMotivos())[0].sistema).toBe(true);
		expect(request.mock.calls[0][0].q.fields).toContain('is_system');
	});

	it('crea con el tipo de Directus (decline), activo, con texto limpio y sin is_system ni requires_note (los fija Directus)', async () => {
		request.mockResolvedValueOnce({ id: 9 });
		await crearMotivo(
			'rechazo',
			{ nombre: ' Sin soporte ', descripcion: '  ' },
			3,
		);
		expect(request.mock.calls[0][0]).toEqual({
			op: 'create',
			c: 'com_over_time_reasons',
			d: {
				name: 'Sin soporte',
				description: null,
				type: 'decline',
				status: 'active',
				sort: 3,
			},
		});
	});

	it('activar/desactivar cambia solo el status', async () => {
		request.mockResolvedValueOnce({});
		await actualizarMotivo(9, { activo: false });
		expect(request.mock.calls[0][0]).toMatchObject({
			op: 'update',
			id: 9,
			d: { status: 'inactive' },
		});
	});

	it('suma los usos como motivo de solicitud y de rechazo', async () => {
		request.mockImplementation(async (q: { o: { groupBy: string[] } }) =>
			q?.o?.groupBy[0] === 'reason_id'
				? [
						{ reason_id: 1, count: { id: '4' } },
						{ reason_id: '9', count: { id: 1 } },
					]
				: [{ review_reason_id: 9, count: { id: '2' } }],
		);
		expect([...(await usosDeMotivos())]).toEqual([
			[1, 4],
			[9, 3],
		]);
	});
});
