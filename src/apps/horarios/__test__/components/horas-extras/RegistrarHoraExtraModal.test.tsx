import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
vi.mock('@/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'uuid-lider' } }) }));
vi.mock('@/apps/horarios/hooks/useAvisos', () => ({ useAvisos: () => ({ showSnackbar }) }));
vi.mock('@/apps/horarios/utils/timeSync', () => ({ getRealColombiaTime: () => dayjs('2026-10-20T10:00:00') }));

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
		<RegistrarHoraExtraModal open empleados={[empleado]} tiendas={tiendas} tiendasLider={[26]} onClose={onClose} />,
		{ wrapper: createQueryWrapper() },
	);

/** Busca al empleado en el autocompletar y lo elige. */
const elegirEmpleado = async () => {
	fireEvent.change(screen.getByLabelText('Empleado'), { target: { value: '1107' } });
	fireEvent.click(await screen.findByText('Ana Pérez · 1107'));
};

beforeEach(() => {
	vi.clearAllMocks();
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

	it('exige elegir un empleado', async () => {
		montar();
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(await screen.findByText('Busca y elige un empleado')).toBeInTheDocument();
		expect(crearHorasExtras).not.toHaveBeenCalled();
	});

	it('no guarda sin horas ni con bloques que no son de 15 minutos', async () => {
		montar();
		await elegirEmpleado();
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(await screen.findByText('Las horas extras deben ser mayores que cero')).toBeInTheDocument();
		// 1.1 h = 66 min: no es múltiplo de 15.
		fireEvent.change(screen.getByLabelText('Horas extras'), { target: { value: '1.1' } });
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		expect(await screen.findByText('Las horas extras van en bloques de 15 minutos')).toBeInTheDocument();
		expect(crearHorasExtras).not.toHaveBeenCalled();
	});

	it('guarda con la tienda del empleado por defecto y cierra', async () => {
		const onClose = vi.fn();
		montar(onClose);
		await elegirEmpleado();
		fireEvent.change(screen.getByLabelText('Horas extras'), { target: { value: '1.5' } });
		fireEvent.change(screen.getByLabelText('Observación'), { target: { value: ' Inventario ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(crearHorasExtras).toHaveBeenCalledWith([{
			employee_id: 7,
			store_id: 26,
			work_date: '2026-10-20',
			minutes: 90,
			observations: 'Inventario',
			created_by: 'uuid-lider',
		}]);
		expect(showSnackbar).toHaveBeenCalledWith(expect.stringMatching(/pendiente/), 'success');
	});

	it('acepta bloques de 15 minutos (1.25 h = 1 h 15 min)', async () => {
		const onClose = vi.fn();
		montar(onClose);
		await elegirEmpleado();
		fireEvent.change(screen.getByLabelText('Horas extras'), { target: { value: '1.25' } });
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(crearHorasExtras).toHaveBeenCalledWith([expect.objectContaining({ minutes: 75 })]);
	});

	it('si ya tiene horas ese día, registrar pasa por el aviso: volver no guarda, continuar sí', async () => {
		listarHorasExtras.mockResolvedValue([{ id: 3, status: 'pendiente', minutes: 60 }]);
		const onClose = vi.fn();
		montar(onClose);
		await elegirEmpleado();
		await waitFor(() =>
			expect(listarHorasExtras).toHaveBeenCalledWith(
				expect.objectContaining({ empleadoId: 7, desde: '2026-10-20', hasta: '2026-10-20' }),
			),
		);
		// Ya no hay alerta naranja en el formulario.
		expect(screen.queryByRole('alert')).toBeNull();
		fireEvent.change(screen.getByLabelText('Horas extras'), { target: { value: '2' } });
		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

		const aviso = await screen.findByRole('alertdialog', { name: 'Esta persona ya tiene horas extras ese día' });
		expect(aviso).toHaveTextContent('1 persona ya tiene 1 h');
		const fila = within(aviso).getByRole('row', { name: /Ana Pérez/ });
		expect(within(fila).getAllByRole('cell').map((c) => c.textContent)).toEqual([
			'Ana Pérez',
			'Asesor',
			'20/10/2026',
			'1 h (pendiente)',
			'+ 2 h',
		]);
		// El foco empieza en la acción segura.
		expect(within(aviso).getByRole('button', { name: 'Volver y revisar' })).toHaveFocus();
		fireEvent.click(within(aviso).getByRole('button', { name: 'Volver y revisar' }));
		await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
		expect(crearHorasExtras).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
		fireEvent.click(
			within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sí, continuar' }),
		);
		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(crearHorasExtras).toHaveBeenCalledWith([expect.objectContaining({ minutes: 120 })]);
	});
});
