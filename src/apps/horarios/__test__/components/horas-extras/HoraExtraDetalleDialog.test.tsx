import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HoraExtraDetalleDialog } from '@/apps/horarios/components/horas-extras/HoraExtraDetalleDialog';
import type { HoraExtraFila } from '@/apps/horarios/interfaces/horasExtras';

const fila: HoraExtraFila = {
	id: 1,
	fecha: '2026-10-10',
	empleadoId: 7,
	empleado: 'Ana Pérez',
	documento: '1 107',
	cargo: 'Asesor',
	tiendaId: 26,
	tienda: 'Ipiales',
	rotacion: false,
	minutos: 60,
	motivoId: 1,
	motivo: 'Fuerza mayor',
	motivoRevision: '',
	observacion: '',
	estado: 'aprobada',
	creadaPor: 'Luis Gómez',
	creadaEl: '2026-10-11T14:00:00',
	revisadaPor: 'Marta Ríos',
	revisadaEl: '2026-10-12T10:00:00',
	motivoRechazo: '',
	periodo: null,
};

describe('HoraExtraDetalleDialog · trazabilidad', () => {
	it('muestra quién revisó mientras la hora no está liquidada', () => {
		render(<HoraExtraDetalleDialog fila={fila} onClose={() => {}} />);
		expect(screen.getByText('Revisada por')).toBeInTheDocument();
		expect(screen.getByText('Marta Ríos')).toBeInTheDocument();
	});

	it('liquidada o rechazada: muestra quién de Dirección Comercial decidió', () => {
		const { rerender } = render(
			<HoraExtraDetalleDialog
				fila={{
					...fila,
					periodo: {
						id: 4,
						nombre: 'Quincena 1',
						inicio: '2026-10-01',
						fin: '2026-10-15',
					},
				}}
				onClose={() => {}}
			/>,
		);
		expect(screen.getByText('Marta Ríos')).toBeInTheDocument();
		rerender(
			<HoraExtraDetalleDialog
				fila={{
					...fila,
					estado: 'descartada_comercial',
					motivoRechazo: 'Sin soporte',
				}}
				onClose={() => {}}
			/>,
		);
		expect(screen.getByText('Rechazada por')).toBeInTheDocument();
		expect(screen.getByText('Marta Ríos')).toBeInTheDocument();
	});

	it('rechazada: motivo de la lista y, con "Otros", su texto', () => {
		const { rerender } = render(
			<HoraExtraDetalleDialog
				fila={{
					...fila,
					estado: 'descartada_comercial',
					motivoRevision: 'No autorizada',
					motivoRechazo: '',
				}}
				onClose={() => {}}
			/>,
		);
		expect(screen.getByText('Motivo del rechazo')).toBeInTheDocument();
		expect(screen.getByText('No autorizada')).toBeInTheDocument();
		rerender(
			<HoraExtraDetalleDialog
				fila={{
					...fila,
					estado: 'descartada_comercial',
					motivoRevision: 'Otros',
					motivoRechazo: 'Sin soporte',
				}}
				onClose={() => {}}
			/>,
		);
		expect(screen.getByText('Otros: Sin soporte')).toBeInTheDocument();
	});
});
