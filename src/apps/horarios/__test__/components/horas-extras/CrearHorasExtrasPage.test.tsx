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
const getEmpleadosBulk = vi.fn();
const showSnackbar = vi.fn();
const irA = vi.fn();
vi.mock('@/apps/horarios/api/directus/horasExtras', () => ({
	crearHorasExtras: (d: unknown) => crearHorasExtras(d),
	listarHorasExtras: (f: unknown) => listarHorasExtras(f),
}));
const MOTIVOS = [
	{
		id: 1,
		nombre: 'Fuerza mayor',
		descripcion: 'Imprevisto',
		tipo: 'solicitud',
		pideTexto: false,
		activo: true,
		orden: 1,
	},
	{
		id: 2,
		nombre: 'Toma física de inventario',
		descripcion: '',
		tipo: 'solicitud',
		pideTexto: false,
		activo: true,
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
];
vi.mock('@/apps/horarios/api/directus/motivos', () => ({
	listarMotivos: async () => MOTIVOS,
}));
vi.mock('@/apps/horarios/api/directus/readBulk', () => ({
	getEmpleadosBulk: (ids: unknown) => getEmpleadosBulk(ids),
}));
vi.mock('@/auth/hooks/useAuth', () => ({
	useAuth: () => ({ user: { id: 'uuid-lider' } }),
}));
vi.mock('@/apps/horarios/hooks/useAvisos', () => ({
	useAvisos: () => ({ showSnackbar }),
}));
vi.mock('@/apps/horarios/utils/timeSync', () => ({
	getRealColombiaTime: () => dayjs('2026-10-22T10:00:00'),
}));
vi.mock('@/apps/horarios/hooks/useHorariosLayout', () => ({
	useHorariosLayout: () => ({
		tienda: { storeIds: [26] },
		acceso: {
			tiendasPermitidas: [
				{ id: 26, name: 'Ipiales' },
				{ id: 30, name: 'Pasto' },
			],
		},
		irA,
	}),
}));

import CrearHorasExtrasPage from '@/apps/horarios/pages/horas-extras/CrearHorasExtrasPage';

const emp = (id: number, nombre: string) => ({
	id: String(id),
	documento: `10${id}`,
	nombre,
	cargo: 'Asesor',
	storeId: 26,
});

/** Pone un motivo a todas las personas filtradas con la barra "Motivo rápido". */
const motivoATodas = async (nombre = 'Fuerza mayor') => {
	fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Motivo' }));
	fireEvent.click(await screen.findByRole('option', { name: nombre }));
	fireEvent.click(screen.getByRole('button', { name: /Poner motivo a todas/ }));
};
/** Por defecto todas las personas quedan con "Fuerza mayor": el resto de pruebas no depende del motivo. */
const montar = async ({ conMotivo = true } = {}) => {
	render(<CrearHorasExtrasPage />, { wrapper: createQueryWrapper() });
	// Las filas se pintan en segundo plano (useDeferredValue): esperar a la primera.
	await screen.findByText('Ana Pérez', {}, { timeout: 5000 });
	if (conMotivo) await motivoATodas();
	return screen.getByRole('table', { name: 'Grilla de horas extras' });
};
const celda = (nombre: string, ddmm: string) =>
	screen.getByLabelText(`Horas de ${nombre} el ${ddmm}`);
const registrar = () => screen.getByRole('button', { name: /^Registrar \(/ });
/** Registrar abre la confirmación; devuelve el diálogo. */
const abrirConfirmacion = async () => {
	// Registrar se habilita al terminar de comprobar las ya registradas.
	await waitFor(() => expect(registrar()).toBeEnabled());
	fireEvent.click(registrar());
	return screen.findByRole('dialog', { name: /Confirmar registro/ });
};
const confirmar = (d: HTMLElement) =>
	fireEvent.click(
		within(d).getByRole('button', { name: /Confirmar y registrar/ }),
	);

beforeEach(() => {
	vi.clearAllMocks();
	getEmpleadosBulk.mockResolvedValue([
		emp(7, 'ANA PÉREZ'),
		emp(8, 'JOSÉ RUIZ'),
	]);
	listarHorasExtras.mockResolvedValue([]);
	crearHorasExtras.mockResolvedValue([]);
});

// La grilla monta muchas filas con inputs: con todas las suites en paralelo, 5 s no alcanzan.
describe('CrearHorasExtrasPage (grilla personas × días)', {
	timeout: 15_000,
}, () => {
	it('filtra las filas por tienda y muestra el cargo en la grilla y en la confirmación', async () => {
		getEmpleadosBulk.mockResolvedValue([
			emp(7, 'ANA PÉREZ'),
			{ ...emp(8, 'JOSÉ RUIZ'), cargo: 'Cajero', storeId: 30 },
		]);
		const grilla = await montar();
		expect(
			within(grilla).getByRole('columnheader', { name: 'Cargo' }),
		).toBeInTheDocument();
		expect(within(grilla).getByText('Cajero')).toBeInTheDocument();
		fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tienda' }));
		fireEvent.click(await screen.findByRole('option', { name: 'Pasto' }));
		await waitFor(() =>
			expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument(),
		);
		expect(screen.getByText('José Ruiz')).toBeInTheDocument();

		fireEvent.change(celda('José Ruiz', '22/10'), { target: { value: '1' } });
		const d = await abrirConfirmacion();
		expect(
			within(d).getByRole('columnheader', { name: 'Cargo' }),
		).toBeInTheDocument();
		expect(within(d).getByText('Cajero')).toBeInTheDocument();
	});

	it('personas en filas y días en columnas; máximo 5 días', async () => {
		const grilla = await montar();
		// Todas las tiendas del líder (el header no tiene selector aquí).
		expect(getEmpleadosBulk).toHaveBeenCalledWith([26, 30]);
		expect(within(grilla).getByText('Ana Pérez')).toBeInTheDocument();
		expect(celda('Ana Pérez', '22/10')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Desde'), {
			target: { value: '2026-10-20' },
		});
		expect(celda('José Ruiz', '20/10')).toBeInTheDocument();
		expect(celda('José Ruiz', '21/10')).toBeInTheDocument();
		expect(screen.getByText('3 días (máximo 5)')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Desde'), {
			target: { value: '2026-10-17' },
		});
		expect(
			screen.getAllByText('El rango admite máximo 5 días').length,
		).toBeGreaterThan(0);
		expect(
			screen.queryByRole('table', { name: 'Grilla de horas extras' }),
		).not.toBeInTheDocument();
	});

	it('rellenar fila y columna con el valor rápido, motivo por persona y registrar en una llamada', async () => {
		await montar();
		fireEvent.change(screen.getByLabelText('Desde'), {
			target: { value: '2026-10-21' },
		});

		// Fila de Ana con 1 h (valor por defecto) en los dos días.
		fireEvent.click(
			screen.getByRole('button', { name: 'Rellenar fila de Ana Pérez' }),
		);
		// Columna 22/10 con 2 h para todos (sin selección = todas las personas).
		fireEvent.click(screen.getByRole('button', { name: '2 h' }));
		fireEvent.click(
			screen.getByRole('button', { name: 'Rellenar columna 22/10' }),
		);
		// José: "Otros" pide el texto del motivo.
		fireEvent.change(screen.getByLabelText('Motivo de José Ruiz'), {
			target: { value: '9' },
		});
		fireEvent.change(screen.getByLabelText('Texto del motivo de José Ruiz'), {
			target: { value: ' Cierre ' },
		});

		expect(celda('Ana Pérez', '21/10')).toHaveValue(1);
		expect(celda('Ana Pérez', '22/10')).toHaveValue(2);
		expect(celda('José Ruiz', '21/10')).toHaveValue(null);
		expect(screen.getByText('3 horas extras')).toBeInTheDocument();

		const dialogo = await abrirConfirmacion();
		// Resumen: totales, personas con sus días y horas, y observación.
		const total = (label: string) =>
			within(dialogo).getByText(label).nextSibling?.textContent;
		expect(total('Registros Vinculados')).toBe('3');
		expect(total('Personas')).toBe('2');
		expect(total('Tiempo total')).toBe('5 h');
		expect(total('Fechas')).toBe('21/10 al 22/10');
		const fila = (nombre: string) =>
			within(within(dialogo).getByRole('row', { name: new RegExp(nombre) }))
				.getAllByRole('cell')
				.map((c) => c.textContent);
		expect(fila('Ana Pérez')).toEqual([
			'Ana Pérez',
			'Asesor',
			'Ipiales',
			'21/10: 1 h22/10: 2 h',
			'3 h',
			'Fuerza mayor',
		]);
		expect(fila('José Ruiz')).toEqual([
			'José Ruiz',
			'Asesor',
			'Ipiales',
			'22/10: 2 h',
			'2 h',
			'Otros: Cierre',
		]);
		expect(crearHorasExtras).not.toHaveBeenCalled();

		confirmar(dialogo);
		await waitFor(() => expect(crearHorasExtras).toHaveBeenCalledTimes(1));
		const enviadas = crearHorasExtras.mock.calls[0][0].map(
			(d: {
				employee_id: number;
				work_date: string;
				minutes: number;
				observations: string;
				reason_id: number;
				store_id: number;
				created_by: string;
			}) =>
				`${d.employee_id}|${d.work_date}|${d.minutes}|${d.store_id}|${d.reason_id}|${d.observations}|${d.created_by}`,
		);
		expect(enviadas).toEqual([
			'7|2026-10-21|60|26|1||uuid-lider',
			'7|2026-10-22|120|26|1||uuid-lider',
			'8|2026-10-22|120|26|9|Cierre|uuid-lider',
		]);
		await waitFor(() =>
			expect(irA).toHaveBeenCalledWith('horas-extras/registradas'),
		);
		expect(showSnackbar).toHaveBeenCalledWith(
			'3 horas extras registradas: quedan pendientes de aprobación',
			'success',
		);
	});

	it('aplicar a seleccionadas; rellenar columna respeta la selección; limpiar', async () => {
		await montar();
		fireEvent.click(screen.getByLabelText('Seleccionar José Ruiz'));
		fireEvent.click(
			screen.getByRole('button', { name: 'Aplicar a seleccionadas (1)' }),
		);
		expect(celda('José Ruiz', '22/10')).toHaveValue(1);
		expect(celda('Ana Pérez', '22/10')).toHaveValue(null);

		fireEvent.click(screen.getByRole('button', { name: '30 min' }));
		fireEvent.click(
			screen.getByRole('button', { name: 'Rellenar columna 22/10' }),
		);
		expect(celda('José Ruiz', '22/10')).toHaveValue(0.5);
		expect(celda('Ana Pérez', '22/10')).toHaveValue(null);

		fireEvent.click(screen.getByRole('button', { name: 'Limpiar horas' }));
		expect(celda('José Ruiz', '22/10')).toHaveValue(null);
		expect(registrar()).toBeDisabled();
	});

	it('una celda fuera de bloque bloquea; la tienda por fila (rotación) va en el envío', async () => {
		await montar();
		// 0.6 h = 36 min: no es múltiplo de 15 (0.75 = 45 min ya es válido).
		fireEvent.change(celda('Ana Pérez', '22/10'), {
			target: { value: '0.6' },
		});
		expect(screen.getByText(/1 celda tiene errores/)).toBeInTheDocument();
		expect(registrar()).toBeDisabled();
		fireEvent.change(celda('Ana Pérez', '22/10'), {
			target: { value: '0.75' },
		});
		expect(registrar()).toBeEnabled();
		fireEvent.change(celda('Ana Pérez', '22/10'), { target: { value: '1.5' } });

		fireEvent.change(screen.getByLabelText('Tienda donde trabajó Ana Pérez'), {
			target: { value: '30' },
		});
		const dialogo = await abrirConfirmacion();
		expect(within(dialogo).getByText('Pasto')).toBeInTheDocument();
		confirmar(dialogo);
		await waitFor(() => expect(crearHorasExtras).toHaveBeenCalled());
		expect(crearHorasExtras.mock.calls[0][0][0]).toMatchObject({
			employee_id: 7,
			store_id: 30,
			minutes: 90,
		});
	});

	it('si alguien ya tiene horas ese día: marca discreta en la celda y paso de advertencia antes del resumen', async () => {
		listarHorasExtras.mockResolvedValue([
			{
				id: 3,
				employee_id: 7,
				work_date: '2026-10-22',
				status: 'pendiente',
				minutes: 60,
			},
		]);
		await montar();
		// Marca discreta (ícono con etiqueta), sin texto ni alertas naranjas.
		expect(
			await screen.findByRole('img', {
				name: 'Ya tiene 1 h pendiente ese día',
			}),
		).toBeInTheDocument();
		fireEvent.change(celda('Ana Pérez', '22/10'), { target: { value: '1' } });
		expect(screen.queryByText(/coincide/)).toBeNull();

		fireEvent.click(registrar());
		const aviso = await screen.findByRole('alertdialog', {
			name: 'Esta persona ya tiene horas extras ese día',
		});
		expect(
			within(aviso)
				.getAllByRole('cell')
				.map((c) => c.textContent),
		).toEqual([
			'Ana Pérez',
			'Asesor',
			'22/10/2026',
			'1 h (pendiente)',
			'+ 1 h',
		]);
		// Volver no registra ni abre el resumen.
		fireEvent.click(
			within(aviso).getByRole('button', { name: 'Volver y revisar' }),
		);
		await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
		expect(
			screen.queryByRole('dialog', { name: /Confirmar registro/ }),
		).toBeNull();

		// Continuar lleva al resumen, que ya no repite la alerta.
		fireEvent.click(registrar());
		fireEvent.click(
			within(await screen.findByRole('alertdialog')).getByRole('button', {
				name: 'Sí, continuar',
			}),
		);
		const resumen = await screen.findByRole('dialog', {
			name: /Confirmar registro/,
		});
		expect(
			within(resumen).getByText('22/10: 1 h (ya tenía)'),
		).toBeInTheDocument();
		expect(within(resumen).queryByText(/coincide/)).toBeNull();
		confirmar(resumen);
		await waitFor(() => expect(crearHorasExtras).toHaveBeenCalled());
	});

	it('al confirmar, el resumen se cierra y no reaparece con lo recién guardado como "(ya tenía)"', async () => {
		await montar();
		fireEvent.change(celda('Ana Pérez', '22/10'), { target: { value: '1' } });
		// Tras guardar, la recarga trae la hora recién creada (como haría Directus).
		crearHorasExtras.mockImplementation(async () => {
			listarHorasExtras.mockResolvedValue([
				{
					id: 50,
					employee_id: 7,
					work_date: '2026-10-22',
					status: 'pendiente',
					minutes: 60,
				},
			]);
			return [];
		});
		const resumen = await abrirConfirmacion();
		confirmar(resumen);
		await waitFor(() =>
			expect(irA).toHaveBeenCalledWith('horas-extras/registradas'),
		);
		// irA está simulado: la página sigue montada, como mientras carga la de destino.
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(screen.queryByText(/ya tenía/)).toBeNull();
		expect(screen.queryByRole('alertdialog')).toBeNull();
		// No se puede registrar otra vez lo mismo.
		expect(registrar()).toBeDisabled();
		expect(crearHorasExtras).toHaveBeenCalledTimes(1);
	});

	it('espera a comprobar las ya registradas antes de dejar registrar', async () => {
		let responder: (v: unknown[]) => void = () => {};
		listarHorasExtras.mockImplementation(
			() =>
				new Promise((r) => {
					responder = r;
				}),
		);
		await montar();
		fireEvent.change(celda('Ana Pérez', '22/10'), { target: { value: '1' } });
		expect(registrar()).toBeDisabled();
		responder([
			{
				id: 3,
				employee_id: 7,
				work_date: '2026-10-22',
				status: 'pendiente',
				minutes: 60,
			},
		]);
		await waitFor(() => expect(registrar()).toBeEnabled());
		fireEvent.click(registrar());
		expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
	});

	it('sin motivo, u "Otros" sin texto, no deja registrar', async () => {
		await montar({ conMotivo: false });
		fireEvent.change(celda('Ana Pérez', '22/10'), { target: { value: '1' } });
		expect(
			await screen.findByText(/1 persona con horas no tiene motivo completo/),
		).toBeInTheDocument();
		expect(screen.getByLabelText('Motivo de Ana Pérez')).toHaveAttribute(
			'aria-invalid',
			'true',
		);
		expect(registrar()).toBeDisabled();

		fireEvent.change(screen.getByLabelText('Motivo de Ana Pérez'), {
			target: { value: '9' },
		});
		expect(screen.getByText('Escribe el motivo')).toBeInTheDocument();
		expect(registrar()).toBeDisabled();
		fireEvent.change(screen.getByLabelText('Texto del motivo de Ana Pérez'), {
			target: { value: 'Visita de auditoría' },
		});
		await waitFor(() => expect(registrar()).toBeEnabled());
		// A quien no tiene horas no se le exige motivo.
		expect(screen.queryByText(/no tiene motivo completo/)).toBeNull();
	});

	it('"Poner motivo" va a las seleccionadas o, si no hay, a todas las filtradas', async () => {
		await montar({ conMotivo: false });
		fireEvent.click(screen.getByLabelText('Seleccionar José Ruiz'));
		fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Motivo' }));
		fireEvent.click(
			await screen.findByRole('option', { name: 'Toma física de inventario' }),
		);
		fireEvent.click(
			screen.getByRole('button', { name: 'Poner motivo a seleccionadas (1)' }),
		);
		expect(screen.getByLabelText('Motivo de José Ruiz')).toHaveValue('2');
		expect(screen.getByLabelText('Motivo de Ana Pérez')).toHaveValue('');
	});

	it('valores rápidos desde 15 minutos', async () => {
		await montar();
		expect(screen.getByRole('button', { name: '15 min' })).toBeInTheDocument();
	});

	it('muestra el cargando mientras llegan las personas', async () => {
		let resolver: (v: unknown) => void = () => {};
		getEmpleadosBulk.mockReturnValue(new Promise((r) => (resolver = r)));
		render(<CrearHorasExtrasPage />, { wrapper: createQueryWrapper() });
		expect(
			await screen.findByText('Cargando personas de 2 tiendas...'),
		).toBeInTheDocument();
		resolver([emp(7, 'ANA PÉREZ')]);
		expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
	});

	it('pagina la grilla (25 por página) y rellenar columna alcanza a todas las filtradas', async () => {
		getEmpleadosBulk.mockResolvedValue(
			Array.from({ length: 30 }, (_, i) =>
				emp(i + 1, `PERSONA ${String(i + 1).padStart(2, '0')}`),
			),
		);
		render(<CrearHorasExtrasPage />, { wrapper: createQueryWrapper() });
		await screen.findByText('Persona 01', {}, { timeout: 5000 });
		expect(screen.queryByText('Persona 26')).not.toBeInTheDocument();
		expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole('button', { name: 'Rellenar columna 22/10' }),
		);
		expect(screen.getByText('30 horas extras')).toBeInTheDocument();
	});

	it('buscar sin tildes filtra filas', async () => {
		await montar();
		fireEvent.change(screen.getByLabelText('Buscar persona'), {
			target: { value: 'jose' },
		});
		expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument();
		expect(screen.getByText('José Ruiz')).toBeInTheDocument();
	});
});
