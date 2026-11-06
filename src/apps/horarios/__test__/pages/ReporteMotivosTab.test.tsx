import { fireEvent, render, screen, within } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../utils/test-utils';

const agregado = vi.fn();
const exportar = vi.fn();
vi.mock('@/apps/horarios/api/directus/reportesHorasExtras', () => ({
	agregadoHorasExtras: (f: unknown, g: string[]) => agregado(f, g),
	listarZonas: async () => [
		{ id: 'Narino', nombre: 'Narino', tiendas: [26, 30] },
	],
	nombresDeUsuarios: async () => new Map([['u1', 'LUIS GÓMEZ']]),
}));
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
			id: 2,
			nombre: 'Inventario',
			descripcion: '',
			tipo: 'solicitud',
			pideTexto: false,
			activo: true,
			orden: 2,
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
vi.mock('@/apps/horarios/api/directus/periodos', () => ({
	listarPeriodosResumen: async () => [
		{
			id: 2,
			name: 'Oct 2',
			start_date: '2026-10-16',
			end_date: '2026-10-31',
			status: 'preliquidado',
		},
	],
}));
vi.mock('@/apps/horarios/components/reportes/DateRangeFilter', () => ({
	default: () => <div>CALENDARIO</div>,
}));
vi.mock('@/apps/horarios/utils/exportarReporteHorasExtras', () => ({
	exportarReporteMotivosExcel: (a: unknown) => exportar(a),
}));
// jsdom no mide el SVG: la gráfica se sustituye por sus datos.
vi.mock('@mui/x-charts/BarChart', () => ({
	BarChart: ({
		series,
		yAxis,
	}: {
		series: { label: string; data: number[] }[];
		yAxis: { data: string[] }[];
	}) => (
		<div data-testid="grafica">
			{series[0].label}:{' '}
			{yAxis[0].data.map((n, i) => `${n}=${series[0].data[i]}`).join(', ')}
		</div>
	),
}));
vi.mock('@/apps/horarios/hooks/useAvisos', () => ({
	useAvisos: () => ({ showSnackbar: vi.fn() }),
}));
vi.mock('@/apps/horarios/utils/timeSync', () => ({
	getRealColombiaTime: () => dayjs('2026-10-28T10:00:00'),
}));

import ReporteMotivosTab, {
	type PerfilMotivos,
} from '@/apps/horarios/pages/reporte/ReporteMotivosTab';

const f = (o: Record<string, unknown>) => ({
	motivoId: null,
	motivoRevisionId: null,
	creadaPor: null,
	estado: null,
	registros: 1,
	minutos: 60,
	...o,
});

beforeEach(() => {
	vi.clearAllMocks();
	agregado.mockImplementation(async (_f: unknown, g: string[]) => {
		if (g.includes('created_by'))
			return [
				f({
					creadaPor: 'u1',
					motivoId: 1,
					estado: 'aprobada',
					minutos: 180,
					registros: 2,
				}),
			];
		if (g.includes('review_reason_id')) return [f({ motivoRevisionId: 5 })];
		return [
			f({ motivoId: 1, estado: 'aprobada', minutos: 180, registros: 2 }),
			f({ motivoId: 1, estado: 'descartada_comercial' }),
			f({ motivoId: 2, estado: 'pendiente', minutos: 30 }),
			f({ motivoId: null, estado: 'aprobada', minutos: 60 }),
		];
	});
});

const montar = async (
	perfil: PerfilMotivos,
	tiendasJefe: number[] | null = null,
) => {
	render(<ReporteMotivosTab perfil={perfil} tiendasJefe={tiendasJefe} />, {
		wrapper: createQueryWrapper(),
	});
	await screen.findByText('Horas aprobadas', { selector: 'p' });
};
const kpis = () =>
	screen
		.getAllByText(/./, { selector: 'p.MuiTypography-body2' })
		.filter((p) => !p.closest('li'))
		.map((p) => p.textContent);
const graficas = () =>
	screen.getAllByTestId('grafica').map((g) => g.textContent);
const columnas = (nombre: string) =>
	within(screen.getByRole('table', { name: nombre }))
		.getAllByRole('columnheader')
		.map((c) => c.textContent);

describe('Reportes · Horas extras por motivo', () => {
	it('comercial: indicadores, dos gráficas, detalle, jefes y Excel', async () => {
		await montar('comercial');
		expect(kpis()).toEqual([
			'Horas aprobadas',
			'Registros aprobados',
			'Registros rechazados',
			'% aprobación',
			'Pendientes de revisar',
		]);
		expect(graficas()).toEqual([
			'Horas aprobadas por motivo: Fuerza mayor=3, Sin motivo (histórico)=1',
			'Rechazos por motivo: No autorizada=1',
		]);
		expect(columnas('Detalle por motivo')).toEqual([
			'Motivo',
			'Horas aprobadas',
			'Registros',
			'% del total',
			'Pendientes',
			'Rechazadas',
			'% aprobación',
		]);
		expect(await screen.findByText('Luis Gómez')).toBeInTheDocument();
		expect(screen.queryByRole('list')).toBeNull();
		expect(screen.queryByText(/¿/)).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
		expect(exportar).toHaveBeenCalledWith(
			expect.objectContaining({
				filtro: expect.stringContaining('Todas las zonas'),
			}),
		);
	});

	it('nómina: solo aprobadas (sin rechazos), jefes y Excel', async () => {
		await montar('nomina');
		expect(kpis()).toEqual(['Horas aprobadas', 'Registros aprobados']);
		expect(graficas()).toHaveLength(1);
		expect(columnas('Detalle por motivo')).toEqual([
			'Motivo',
			'Horas aprobadas',
			'Registros',
			'% del total',
		]);
		expect(
			await screen.findByRole('table', {
				name: 'Horas aprobadas por jefe de zona',
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Exportar Excel' }),
		).toBeInTheDocument();
	});

	it('jefe de zona: solo sus tiendas, sin jefes ni Excel', async () => {
		await montar('jefe', [26]);
		expect(agregado).toHaveBeenCalledWith(
			expect.objectContaining({ tiendas: [26] }),
			['reason_id', 'status'],
		);
		expect(agregado.mock.calls.some(([, g]) => g.includes('created_by'))).toBe(
			false,
		);
		expect(screen.queryByRole('combobox', { name: 'Zona' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Exportar Excel' })).toBeNull();
		expect(graficas()).toHaveLength(2);
	});

	it('gerencia: solo indicadores y las dos gráficas', async () => {
		await montar('gerencia');
		expect(kpis()).toEqual([
			'Horas aprobadas',
			'Registros aprobados',
			'Registros rechazados',
			'% aprobación',
		]);
		expect(graficas()).toHaveLength(2);
		expect(screen.queryByRole('table')).toBeNull();
		// Los datos de cada gráfica también en una lista corta.
		expect(
			within(screen.getByRole('list', { name: 'Horas aprobadas por motivo' }))
				.getAllByRole('listitem')
				.map((t) => t.textContent),
		).toEqual(['Fuerza mayor3 h75 %', 'Sin motivo (histórico)1 h25 %']);
		expect(
			screen.getByRole('list', { name: 'Rechazos por motivo' }),
		).toHaveTextContent('No autorizada1 registro100 %');
		expect(agregado.mock.calls.some(([, g]) => g.includes('created_by'))).toBe(
			false,
		);
		expect(screen.queryByRole('button', { name: 'Exportar Excel' })).toBeNull();
	});
});
