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
const guardarBloque = vi.fn();
vi.mock('@/apps/horarios/api/directus/configHorasExtras', () => ({
	leerConfigBloqueAdmin: async () => ({
		bloque: 15,
		cambiadoPor: 'Ana Pérez',
		cambiadoEl: '2026-11-06T10:30:00',
	}),
	minutosPendientes: async () =>
		new Map([
			[45, 2],
			[60, 1],
		]),
	guardarBloqueHorasExtras: (m: number) => guardarBloque(m),
}));
let periodosError = false;
vi.mock('@/apps/horarios/api/directus/periodos', () => ({
	listarPeriodosResumen: async () => {
		if (periodosError) throw new Error('403 com_period');
		return [
			{
				id: 3,
				name: 'Nov 1',
				start_date: '2026-11-01',
				end_date: '2026-11-15',
				status: 'preliquidado',
			},
		];
	},
}));
vi.mock('@/apps/horarios/utils/timeSync', async () => {
	const dayjs = (await import('dayjs')).default;
	return { getRealColombiaTime: () => dayjs('2026-11-07T10:00:00') };
});
const showSnackbar = vi.fn();
vi.mock('@/apps/horarios/hooks/useAvisos', () => ({
	useAvisos: () => ({ showSnackbar }),
}));

import HorasExtrasAdminPage from '@/apps/horarios/pages/admin/HorasExtrasAdminPage';

beforeEach(() => {
	vi.clearAllMocks();
	crearMotivo.mockResolvedValue({});
	guardarBloque.mockResolvedValue({});
	periodosError = false;
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
	render(<HorasExtrasAdminPage />, { wrapper: createQueryWrapper() });
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
		fireEvent.click(screen.getByRole('tab', { name: 'Motivos de rechazo' }));
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

describe('Admin · Bloque de tiempo', () => {
	const irABloque = async () => {
		render(<HorasExtrasAdminPage />, { wrapper: createQueryWrapper() });
		fireEvent.click(screen.getByRole('tab', { name: 'Bloque de tiempo' }));
		return screen.findByRole('radiogroup');
	};

	it('muestra el bloque vigente y el último cambio; guardar solo con otro valor', async () => {
		await irABloque();
		expect(screen.getByRole('radio', { name: /15 min/ })).toBeChecked();
		expect(
			screen.getByText('Último cambio: Ana Pérez · 06/11/2026 10:30'),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
	});

	it('pide confirmar con las implicaciones reales y guarda', async () => {
		await irABloque();
		fireEvent.click(screen.getByRole('radio', { name: /30 min/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
		const dialogo = screen.getByRole('dialog', {
			name: '¿Cambiar el bloque de 15 min a 30 min?',
		});
		// 45 min no es múltiplo de 30; el periodo Nov 1 contiene hoy.
		expect(
			await within(dialogo).findByText(/2 horas pendientes/),
		).toBeInTheDocument();
		expect(await within(dialogo).findByText('Nov 1')).toBeInTheDocument();
		expect(
			within(dialogo).getByRole('button', { name: 'Cancelar' }),
		).toHaveFocus();
		expect(guardarBloque).not.toHaveBeenCalled();
		fireEvent.click(
			within(dialogo).getByRole('button', { name: 'Cambiar a 30 min' }),
		);
		await waitFor(() => expect(guardarBloque).toHaveBeenCalledWith(30));
		expect(showSnackbar).toHaveBeenCalledWith(
			'Bloque cambiado a 30 min (0.5 h)',
			'success',
		);
	});

	it('sin permiso sobre los periodos lo dice y aun así guarda', async () => {
		periodosError = true;
		await irABloque();
		fireEvent.click(screen.getByRole('radio', { name: /60 min/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
		const dialogo = screen.getByRole('dialog');
		expect(
			await within(dialogo).findByText(
				'No se pudo revisar si hay un periodo en curso.',
				{},
				{ timeout: 5000 },
			),
		).toBeInTheDocument();
		fireEvent.click(
			within(dialogo).getByRole('button', { name: 'Cambiar a 60 min' }),
		);
		await waitFor(() => expect(guardarBloque).toHaveBeenCalledWith(60));
	});
});
