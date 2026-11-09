import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Rol } from '@/apps/horarios/navigation/secciones';

let roles: Rol[] = [];
vi.mock('@/apps/horarios/hooks/useHorariosLayout', () => ({
	useHorariosLayout: () => ({
		acceso: {
			roles: new Set(roles),
			tiendasPermitidas: [{ id: 26, name: 'Ipiales' }],
		},
	}),
}));
vi.mock('@/apps/horarios/pages/reporte/ReporteHorasExtrasTab', () => ({
	default: () => <div>TIEMPO REAL</div>,
}));
vi.mock('@/apps/horarios/pages/reporte/ReporteZonaTab', () => ({
	default: ({ tiendasJefe }: { tiendasJefe: number[] | null }) => (
		<div>ZONA {JSON.stringify(tiendasJefe)}</div>
	),
}));
vi.mock('@/apps/horarios/pages/reporte/ReporteMotivosTab', () => ({
	default: ({
		perfil,
		tiendasJefe,
	}: {
		perfil: string;
		tiendasJefe: number[] | null;
	}) => (
		<div>
			MOTIVOS {perfil} {JSON.stringify(tiendasJefe)}
		</div>
	),
}));
vi.mock('@/apps/horarios/pages/reporte/gerencia/ReporteGerencia', () => ({
	default: () => <div>GERENCIA</div>,
}));

import ReporteHorasExtrasVista from '@/apps/horarios/pages/reporte/ReporteHorasExtrasVista';

const montar = (r: Rol[]) => {
	roles = r;
	render(<ReporteHorasExtrasVista />);
};

describe('Reportes · Horas extras: pestañas por rol', () => {
	it('jefe de zona: Por zona y Por motivo, con sus tiendas', () => {
		montar(['areaManager', 'report']);
		expect(screen.getByText('ZONA [26]')).toBeInTheDocument();
		expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
			'Por zona',
			'Por motivo',
		]);
		fireEvent.click(screen.getByRole('tab', { name: 'Por motivo' }));
		expect(screen.getByText('MOTIVOS jefe [26]')).toBeInTheDocument();
	});
	it('nómina: Tiempo real y Por motivo', () => {
		montar(['tienda', 'nomina']);
		expect(screen.getByText('TIEMPO REAL')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: 'Por motivo' }));
		expect(screen.getByText('MOTIVOS nomina null')).toBeInTheDocument();
	});
	it('gerencia: su propio reporte (sin personas)', () => {
		montar(['gerencia']);
		expect(screen.getByText('GERENCIA')).toBeInTheDocument();
		expect(screen.queryByText(/ZONA|TIEMPO REAL/)).not.toBeInTheDocument();
	});
	it('gerencia + comercial: manda comercial (ve más)', () => {
		montar(['gerencia', 'comercial']);
		expect(screen.queryByText('GERENCIA')).not.toBeInTheDocument();
		expect(
			screen.getByRole('tab', { name: 'Tiempo real' }),
		).toBeInTheDocument();
	});
	it('comercial: Tiempo real y Por zona sin tiendas fijas (elige zona)', () => {
		montar(['tienda', 'comercial']);
		expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
			'Tiempo real',
			'Por zona',
			'Por motivo',
		]);
		fireEvent.click(screen.getByRole('tab', { name: 'Por zona' }));
		expect(screen.getByText('ZONA null')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: 'Por motivo' }));
		expect(screen.getByText('MOTIVOS comercial null')).toBeInTheDocument();
	});
});
