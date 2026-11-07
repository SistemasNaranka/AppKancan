import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../utils/test-utils';

const crearMotivo = vi.fn();
const actualizarMotivo = vi.fn();
const borrarMotivo = vi.fn();
const motivo = (
	id: number,
	nombre: string,
	extra: Record<string, unknown> = {},
) => ({
	id,
	nombre,
	descripcion: '',
	tipo: 'solicitud',
	pideTexto: false,
	activo: true,
	orden: id,
	sistema: false,
	...extra,
});
let catalogo: ReturnType<typeof motivo>[] = [];
vi.mock('@/apps/horarios/api/directus/motivos', () => ({
	listarMotivos: async () => catalogo,
	usosDeMotivos: async () => new Map([[10, 3]]),
	crearMotivo: (...a: unknown[]) => crearMotivo(...a),
	actualizarMotivo: (...a: unknown[]) => actualizarMotivo(...a),
	borrarMotivo: (...a: unknown[]) => borrarMotivo(...a),
}));
const showSnackbar = vi.fn();
vi.mock('@/apps/horarios/hooks/useAvisos', () => ({
	useAvisos: () => ({ showSnackbar }),
}));

import MotivosPage from '@/apps/horarios/pages/admin/MotivosPage';

beforeEach(() => {
	vi.clearAllMocks();
	crearMotivo.mockResolvedValue({});
	actualizarMotivo.mockResolvedValue({});
	borrarMotivo.mockResolvedValue(undefined);
	catalogo = [
		motivo(1, 'Fuerza mayor', { sistema: true }),
		motivo(10, 'Auditoría'),
		motivo(11, 'Sin uso', { activo: false }),
		motivo(99, 'Otros', { sistema: true, pideTexto: true }),
		motivo(50, 'No autorizada', { tipo: 'rechazo', sistema: true }),
	];
});

const montar = async () => {
	render(<MotivosPage />, { wrapper: createQueryWrapper() });
	return screen.findByRole('table', { name: 'Motivos de solicitud' });
};
const fila = (nombre: string) =>
	screen.getByText(nombre).closest('tr') as HTMLElement;

describe('Admin · Motivos de horas extras', () => {
	it('los del sistema no tienen acciones; las opciones nuevas sí', async () => {
		const tabla = await montar();
		expect(
			within(tabla)
				.getAllByRole('row')
				.slice(1)
				.map((r) => r.querySelector('p')?.textContent),
		).toEqual(['Fuerza mayor', 'Auditoría', 'Sin uso', 'Otros']);
		expect(
			within(fila('Fuerza mayor')).getByText('Sistema'),
		).toBeInTheDocument();
		expect(within(fila('Fuerza mayor')).queryByRole('button')).toBeNull();
		expect(within(fila('Otros')).getByText('Pide texto')).toBeInTheDocument();
		// Usado: se edita pero no se borra.
		await within(fila('Auditoría')).findByText('Usado en 3 horas extras');
		expect(
			within(fila('Auditoría')).queryByRole('button', { name: /Borrar/ }),
		).toBeNull();
		expect(
			within(fila('Sin uso')).getByRole('button', { name: 'Borrar Sin uso' }),
		).toBeInTheDocument();
	});

	it('agregar valida el nombre repetido y crea antes de "Otros"', async () => {
		await montar();
		fireEvent.click(screen.getByRole('button', { name: 'Agregar motivo' }));
		const dialogo = screen.getByRole('dialog', {
			name: 'Nuevo motivo de solicitud',
		});
		fireEvent.change(within(dialogo).getByRole('textbox', { name: /Nombre/ }), {
			target: { value: 'fuerza MAYOR' },
		});
		fireEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }));
		expect(
			within(dialogo).getByText('Ya existe un motivo con ese nombre'),
		).toBeInTheDocument();
		expect(crearMotivo).not.toHaveBeenCalled();

		fireEvent.change(within(dialogo).getByRole('textbox', { name: /Nombre/ }), {
			target: { value: 'Apertura' },
		});
		fireEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }));
		await waitFor(() =>
			expect(crearMotivo).toHaveBeenCalledWith(
				'solicitud',
				{ nombre: 'Apertura', descripcion: '' },
				12,
			),
		);
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('activar/desactivar y borrar una opción sin uso', async () => {
		await montar();
		fireEvent.click(screen.getByRole('switch', { name: 'Activo: Auditoría' }));
		await waitFor(() =>
			expect(actualizarMotivo).toHaveBeenCalledWith(10, { activo: false }),
		);

		fireEvent.click(screen.getByRole('button', { name: 'Borrar Sin uso' }));
		fireEvent.click(
			within(screen.getByRole('dialog', { name: 'Borrar motivo' })).getByRole(
				'button',
				{ name: 'Borrar' },
			),
		);
		await waitFor(() =>
			expect(borrarMotivo).toHaveBeenCalledWith(11, expect.anything()),
		);
	});

	it(`la pestaña Rechazo muestra su lista`, async () => {
		await montar();
		fireEvent.click(screen.getByRole('tab', { name: 'Rechazo' }));
		const tabla = await screen.findByRole('table', {
			name: 'Motivos de rechazo',
		});
		expect(within(tabla).getByText('No autorizada')).toBeInTheDocument();
	});

	it('sin cupo (10 activos) no deja agregar ni reactivar', async () => {
		catalogo = [
			...Array.from({ length: 10 }, (_, i) => motivo(i + 1, `M${i + 1}`)),
			motivo(20, 'Apagado', { activo: false }),
		];
		await montar();
		expect(
			screen.getByRole('button', { name: 'Agregar motivo' }),
		).toBeDisabled();
		expect(screen.getByText(/Ya hay 10 motivos activos/)).toBeInTheDocument();
		expect(
			screen.getByRole('switch', { name: 'Activo: Apagado' }),
		).toBeDisabled();
	});
});
