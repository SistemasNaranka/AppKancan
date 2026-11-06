import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../utils/test-utils';

vi.mock('@/apps/horarios/api/directus/motivos', () => ({
	listarMotivos: async () => [
		{
			id: 1,
			nombre: 'Fuerza mayor',
			descripcion: '',
			tipo: 'solicitud',
			pideTexto: false,
			activo: true,
			orden: 1,
		},
		{
			id: 5,
			nombre: 'No autorizada',
			descripcion: 'No estaba autorizada',
			tipo: 'rechazo',
			pideTexto: false,
			activo: true,
			orden: 1,
		},
		{
			id: 9,
			nombre: 'Otros',
			descripcion: 'Escribe el motivo del rechazo',
			tipo: 'rechazo',
			pideTexto: true,
			activo: true,
			orden: 99,
		},
	],
}));

import { RevisionHoraExtraDialog } from '@/apps/horarios/components/horas-extras/RevisionHoraExtraDialog';
import type { HoraExtraFila } from '@/apps/horarios/interfaces/horasExtras';

const fila = (id: number, minutos: number): HoraExtraFila => ({
	id,
	fecha: '2026-10-19',
	empleado: `Asesor ${id}`,
	documento: '',
	cargo: 'Cajero',
	tiendaId: 26,
	tienda: 'Ipiales',
	rotacion: false,
	minutos,
	motivo: 'Fuerza mayor',
	motivoRevision: '',
	observacion: '',
	estado: 'pendiente',
	creadaPor: '',
	creadaEl: '',
	empleadoId: id,
	periodo: null,
	revisadaPor: '',
	revisadaEl: '',
	motivoRechazo: '',
});

const montar = (
	decision: 'aprobada' | 'descartada_comercial',
	filas: HoraExtraFila[],
	onConfirmar = vi.fn(),
) =>
	render(
		<RevisionHoraExtraDialog
			decision={decision}
			filas={filas}
			guardando={false}
			onClose={vi.fn()}
			onConfirmar={onConfirmar}
		/>,
		{ wrapper: createQueryWrapper() },
	);
const elegir = async (nombre: string) => {
	fireEvent.mouseDown(
		screen.getByRole('combobox', { name: /^Motivo del rechazo/ }),
	);
	fireEvent.click(await screen.findByRole('option', { name: nombre }));
};

describe('RevisionHoraExtraDialog', () => {
	it('rechazar exige un motivo de la lista de rechazo', async () => {
		const onConfirmar = vi.fn();
		montar('descartada_comercial', [fila(1, 60)], onConfirmar);
		fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
		expect(screen.getByText('Elige un motivo')).toBeInTheDocument();
		expect(onConfirmar).not.toHaveBeenCalled();

		fireEvent.mouseDown(
			screen.getByRole('combobox', { name: /^Motivo del rechazo/ }),
		);
		expect(
			(await screen.findAllByRole('option')).map((o) => o.textContent),
		).toEqual(['No autorizada', 'Otros']);
		fireEvent.click(screen.getByRole('option', { name: 'No autorizada' }));
		expect(screen.getByText('No estaba autorizada')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
		expect(onConfirmar).toHaveBeenCalledWith({ motivoId: 5, nota: '' });
	});

	it('"Otros" pide el texto y lo envía sin espacios', async () => {
		const onConfirmar = vi.fn();
		montar('descartada_comercial', [fila(1, 60)], onConfirmar);
		await elegir('Otros');
		fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
		expect(
			screen.getByRole('textbox', { name: /Escribe el motivo/ }),
		).toHaveAttribute('aria-invalid', 'true');
		expect(onConfirmar).not.toHaveBeenCalled();
		fireEvent.change(
			screen.getByRole('textbox', { name: /Escribe el motivo/ }),
			{ target: { value: '  sin soporte ' } },
		);
		fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
		expect(onConfirmar).toHaveBeenCalledWith({
			motivoId: 9,
			nota: 'sin soporte',
		});
	});

	it('aprobar en lote muestra el resumen y no pide motivo', () => {
		const onConfirmar = vi.fn();
		montar('aprobada', [fila(1, 60), fila(2, 30)], onConfirmar);
		expect(
			screen.getByText('2 registros vinculados · 1 h 30 min en total'),
		).toBeInTheDocument();
		expect(screen.queryByRole('combobox')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
		expect(onConfirmar).toHaveBeenCalledWith({ motivoId: null, nota: '' });
	});
});
