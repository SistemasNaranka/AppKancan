import { render, screen, within } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../utils/test-utils';

const fecha = dayjs().format('YYYY-MM-DD');
const marca = (emp: number, log_type: string, hora: string) => ({
	id: Math.random(),
	record_date: fecha,
	record_time: hora,
	log_type,
	store_id: 26,
	employee_id: {
		id: emp,
		first_name: emp === 7 ? 'ana' : 'beto',
		last_name: 'pérez',
		document_number: `10${emp}`,
	},
});

vi.mock('@/apps/horarios/api/directus/readBulk', () => ({
	getTimeRecordsBulkRange: async () => [
		marca(7, 'Comenzar Jornada', '08:00'),
		marca(7, 'Terminar Jornada', '12:00'),
		marca(8, 'Comenzar Jornada', '08:00'),
		marca(8, 'Terminar Jornada', '10:00'),
	],
	// Beto no está activo: sin cargo.
	getEmpleadosBulk: async () => [
		{
			id: '7',
			nombre: 'ANA PÉREZ',
			documento: '107',
			cargo: 'Cajero',
			storeId: 26,
		},
	],
}));
vi.mock('@/apps/horarios/hooks/useHorariosLayout', () => ({
	useHorariosLayout: () => ({
		acceso: {
			roles: new Set(['nomina']),
			tiendasPermitidas: [{ id: 26, name: 'Ipiales' }],
		},
	}),
}));
vi.mock('@/apps/horarios/hooks/useReporteHorasExtras', () => ({
	useZonas: () => ({ data: [] }),
}));

import ResumenSemanalPage from '@/apps/horarios/pages/horas-extras/ResumenSemanalPage';

describe('ResumenSemanalPage', () => {
	it('muestra el cargo de cada persona en su propia columna', async () => {
		render(<ResumenSemanalPage />, { wrapper: createQueryWrapper() });
		const tabla = screen.getByRole('table', {
			name: 'Horas trabajadas por persona',
		});
		expect(
			within(tabla).getByRole('columnheader', { name: 'Cargo' }),
		).toBeInTheDocument();
		const ana = await within(tabla).findByRole('row', { name: /Ana Pérez/ });
		expect(within(ana).getByText('Cajero')).toBeInTheDocument();
		const beto = within(tabla).getByRole('row', { name: /Beto Pérez/ });
		expect(within(beto).getByText('Sin cargo')).toBeInTheDocument();
	});
});
