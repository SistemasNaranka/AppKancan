import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../utils/test-utils';

const crearHorasExtras = vi.fn();
const listarHorasExtras = vi.fn();
const showSnackbar = vi.fn();
vi.mock('@/apps/horarios/api/directus/horasExtras', () => ({
	crearHorasExtras: (d: unknown) => crearHorasExtras(d),
	listarHorasExtras: (f: unknown) => listarHorasExtras(f),
}));
vi.mock('@/apps/horarios/api/directus/motivos', () => ({
	listarMotivos: async () => [
		{
			id: 1,
			nombre: 'Fuerza mayor',
			descripcion: 'Situación inesperada',
			tipo: 'solicitud',
			pideTexto: false,
			activo: true,
			orden: 1,
		},
		{
			id: 3,
			nombre: 'Viejo',
			descripcion: '',
			tipo: 'solicitud',
			pideTexto: false,
			activo: false,
			orden: 2,
		},
		{
			id: 9,
			nombre: 'Otros',
			descripcion: 'Escribe el motivo',
			tipo: 'solicitud',
			pideTexto: true,
			activo: true,
			orden: 99,
		},
		{
			id: 5,
			nombre: 'No autorizada',
			descripcion: '',
			tipo: 'rechazo',
			pideTexto: false,
			activo: true,
			orden: 1,
		},
	],
}));
let bloque: unknown = 15;
vi.mock('@/apps/horarios/api/directus/configHorasExtras', () => ({
	leerBloqueHorasExtras: async () => {
		if (bloque instanceof Error) throw bloque;
		return bloque;
	},
}));
vi.mock('@/auth/hooks/useAuth', () => ({
	useAuth: () => ({ user: { id: 'uuid-lider' } }),
}));
vi.mock('@/apps/horarios/hooks/useAvisos', () => ({
	useAvisos: () => ({ showSnackbar }),
}));
vi.mock('@/apps/horarios/utils/timeSync', () => ({
	getRealColombiaTime: () => dayjs('2026-10-20T10:00:00'),
}));

import { RegistrarHoraExtraModal } from '@/apps/horarios/components/horas-extras/RegistrarHoraExtraModal';
import { crearRegistrosVacios, ESTADO } from '@/apps/horarios/domain/registro';

const empleado = {
	id: '7',
	documento: '1107',
	nombre: 'ANA PÉREZ',
	cargo: 'Asesor',
	storeId: 26,
	estadoActual: ESTADO.entradaPendiente,
	registros: crearRegistrosVacios(),
};
const tiendas = [
	{ id: 26, name: 'Ipiales Centro' },
	{ id: 30, name: 'Pasto' },
];

const montar = (onClose = vi.fn()) =>
	render(
		<RegistrarHoraExtraModal
			open
			empleados={[empleado]}
			tiendas={tiendas}
			tiendasLider={[26]}
			onClose={onClose}
		/>,
		{ wrapper: createQueryWrapper() },
	);

/** Busca al empleado en el autocompletar y lo elige. */
const elegirEmpleado = async () => {
	fireEvent.change(screen.getByLabelText('Empleado'), {
		target: { value: '1107' },
	});
	fireEvent.click(await screen.findByText('Ana Pérez · 1107'));
};
const elegirMotivo = async (nombre = 'Fuerza mayor') => {
	fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Motivo/ }));
	fireEvent.click(await screen.findByRole('option', { name: nombre }));
};

beforeEach(() => {
	vi.clearAllMocks();
	bloque = 15;
	listarHorasExtras.mockResolvedValue([]);
	crearHorasExtras.mockResolvedValue([{ id: 1 }]);
});

describe('RegistrarHoraExtraModal (individual)', () => {
	it('al elegir a la persona muestra su cargo destacado, con documento y tienda', async () => {
		montar();
		await elegirEmpleado();
		const tarjeta = screen.getByRole('group', { name: 'Persona elegida' });
		expect(tarjeta).toHaveTextContent('CargoAsesor');
		expect(tarjeta).toHaveTextContent('Documento1107');
		expect(tarjeta).toHaveTextContent('Su tiendaIpiales Centro');
	});

	it('motivo obligatorio: solo los activos de solicitud; "Otros" pide texto', async () => {
		montar();
		await elegirEmpleado();
		fireEvent.change(screen.getByLabelText('Horas extras'), {
			target: { value: '1' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(await screen.findByText('Elige un motivo')).toBeInTheDocument();
		expect(crearHorasExtras).not.toHaveBeenCalled();

		fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Motivo/ }));
		const opciones = (await screen.findAllByRole('option')).map(
			(o) => o.textContent,
		);
		expect(opciones).toEqual(['Fuerza mayor', 'Otros']);
		fireEvent.click(screen.getByRole('option', { name: 'Fuerza mayor' }));
		// La descripción ayuda a elegir; sin "Otros" no hay campo de texto.
		expect(screen.getByText('Situación inesperada')).toBeInTheDocument();
		expect(screen.queryByLabelText(/Escribe el motivo/)).toBeNull();

		await elegirMotivo('Otros');
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		await waitFor(() =>
			expect(
				screen.getByRole('textbox', { name: /Escribe el motivo/ }),
			).toHaveAttribute('aria-invalid', 'true'),
		);
		expect(crearHorasExtras).not.toHaveBeenCalled();
	});

	it('exige elegir un empleado', async () => {
		montar();
		// Espera a conocer el bloque configurado.
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Registrar' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(
			await screen.findByText('Busca y elige un empleado'),
		).toBeInTheDocument();
		expect(crearHorasExtras).not.toHaveBeenCalled();
	});

	it('no guarda sin horas ni con bloques que no son de 15 minutos', async () => {
		montar();
		await elegirEmpleado();
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(
			await screen.findByText('Las horas extras deben ser mayores que cero'),
		).toBeInTheDocument();
		// 1.1 h = 66 min: no es múltiplo de 15.
		fireEvent.change(screen.getByLabelText('Horas extras'), {
			target: { value: '1.1' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(
			await screen.findByText(
				'Las horas extras van en bloques de 15 min (0.25 h)',
			),
		).toBeInTheDocument();
		expect(crearHorasExtras).not.toHaveBeenCalled();
	});

	it('guarda con la tienda del empleado por defecto y cierra', async () => {
		const onClose = vi.fn();
		montar(onClose);
		await elegirEmpleado();
		fireEvent.change(screen.getByLabelText('Horas extras'), {
			target: { value: '1.5' },
		});
		await elegirMotivo('Otros');
		fireEvent.change(screen.getByLabelText(/Escribe el motivo/), {
			target: { value: ' Inventario ' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(crearHorasExtras).toHaveBeenCalledWith([
			{
				employee_id: 7,
				store_id: 26,
				work_date: '2026-10-20',
				minutes: 90,
				reason_id: 9,
				observations: 'Inventario',
				created_by: 'uuid-lider',
			},
		]);
		expect(showSnackbar).toHaveBeenCalledWith(
			expect.stringMatching(/pendiente/),
			'success',
		);
	});

	it('acepta bloques de 15 minutos (1.25 h = 1 h 15 min)', async () => {
		const onClose = vi.fn();
		montar(onClose);
		await elegirEmpleado();
		await elegirMotivo();
		fireEvent.change(screen.getByLabelText('Horas extras'), {
			target: { value: '1.25' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(crearHorasExtras).toHaveBeenCalledWith([
			expect.objectContaining({ minutes: 75 }),
		]);
	});

	it('usa el bloque configurado: con 30 min, 1.25 h no es válido', async () => {
		bloque = 30;
		montar();
		expect(
			await screen.findByText('En bloques de 30 min (0.5 h)'),
		).toBeInTheDocument();
		await elegirEmpleado();
		await elegirMotivo();
		fireEvent.change(screen.getByLabelText('Horas extras'), {
			target: { value: '1.25' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(
			await screen.findByText(
				'Las horas extras van en bloques de 30 min (0.5 h)',
			),
		).toBeInTheDocument();
		expect(crearHorasExtras).not.toHaveBeenCalled();
	});

	it('sin configuración usa 15 min y lo avisa', async () => {
		bloque = new Error('403');
		montar();
		expect(
			await screen.findByText(
				/No se pudo cargar el bloque configurado/,
				{},
				{ timeout: 4000 },
			),
		).toBeInTheDocument();
		expect(
			screen.getByText('En bloques de 15 min (0.25 h)'),
		).toBeInTheDocument();
	});

	it('si ya tiene horas ese día, registrar pasa por el aviso: volver no guarda, continuar sí', async () => {
		listarHorasExtras.mockResolvedValue([
			{ id: 3, status: 'pendiente', minutes: 60 },
		]);
		const onClose = vi.fn();
		montar(onClose);
		await elegirEmpleado();
		await elegirMotivo();
		await waitFor(() =>
			expect(listarHorasExtras).toHaveBeenCalledWith(
				expect.objectContaining({
					empleadoId: 7,
					desde: '2026-10-20',
					hasta: '2026-10-20',
				}),
			),
		);
		// Ya no hay alerta naranja en el formulario.
		expect(screen.queryByRole('alert')).toBeNull();
		fireEvent.change(screen.getByLabelText('Horas extras'), {
			target: { value: '2' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

		const aviso = await screen.findByRole('alertdialog', {
			name: 'Esta persona ya tiene horas extras ese día',
		});
		expect(aviso).toHaveTextContent('1 persona ya tiene 1 h');
		const fila = within(aviso).getByRole('row', { name: /Ana Pérez/ });
		expect(
			within(fila)
				.getAllByRole('cell')
				.map((c) => c.textContent),
		).toEqual([
			'Ana Pérez',
			'Asesor',
			'20/10/2026',
			'1 h (pendiente)',
			'+ 2 h',
		]);
		// El foco empieza en la acción segura.
		expect(
			within(aviso).getByRole('button', { name: 'Volver y revisar' }),
		).toHaveFocus();
		fireEvent.click(
			within(aviso).getByRole('button', { name: 'Volver y revisar' }),
		);
		await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
		expect(crearHorasExtras).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		fireEvent.click(
			within(await screen.findByRole('alertdialog')).getByRole('button', {
				name: 'Sí, continuar',
			}),
		);
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(crearHorasExtras).toHaveBeenCalledWith([
			expect.objectContaining({ minutes: 120 }),
		]);
	});
});
