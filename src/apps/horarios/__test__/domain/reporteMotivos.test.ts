import { describe, expect, it } from 'vitest';
import {
	motivosPorJefe,
	rechazosPorMotivo,
	reporteMotivos,
} from '@/apps/horarios/domain/horasExtras';

const f = (
	motivoId: number | null,
	estado: string,
	minutos: number,
	registros = 1,
	creadaPor: string | null = null,
) => ({
	motivoId,
	estado,
	minutos,
	registros,
	creadaPor,
});

describe('reporteMotivos', () => {
	const r = reporteMotivos([
		f(1, 'aprobada', 120, 2),
		f(1, 'descartada_comercial', 60, 1),
		f(2, 'aprobada', 360, 3),
		f(2, 'pendiente', 30, 1),
		f(null, 'aprobada', 600, 5),
		f(3, 'sugerida', 999, 9),
	]);

	it('los totales cuadran con la suma por estado (sugeridas fuera)', () => {
		expect(r.aprobadas).toEqual({ registros: 10, minutos: 1080 });
		expect(r.pendientes).toEqual({ registros: 1, minutos: 30 });
		expect(r.rechazadas).toEqual({ registros: 1, minutos: 60 });
		expect(r.motivos.reduce((s, m) => s + m.aprobadas.minutos, 0)).toBe(
			r.aprobadas.minutos,
		);
		expect(r.motivos.map((m) => m.motivoId)).not.toContain(3);
	});

	it('más horas aprobadas primero, histórico al final; % y tasa de aprobación', () => {
		expect(r.motivos.map((m) => m.motivoId)).toEqual([2, 1, null]);
		expect(r.motivos[0].porcentaje).toBeCloseTo(360 / 1080);
		expect(r.motivos[1].tasaAprobacion).toBeCloseTo(2 / 3);
		expect(r.motivos[0].tasaAprobacion).toBe(1);
		expect(r.tasaAprobacion).toBeCloseTo(10 / 11);
	});

	it('sin revisadas no hay tasa', () => {
		expect(
			reporteMotivos([f(1, 'pendiente', 60)]).motivos[0].tasaAprobacion,
		).toBeNull();
	});
});

describe('rechazosPorMotivo', () => {
	it('porcentaje sobre registros; histórico al final', () => {
		const r = rechazosPorMotivo([
			f(null, '', 60, 1),
			f(5, '', 60, 1),
			f(6, '', 180, 2),
		]);
		expect(r.map((x) => [x.motivoId, x.porcentaje])).toEqual([
			[6, 0.5],
			[5, 0.25],
			[null, 0.25],
		]);
	});
});

describe('motivosPorJefe', () => {
	it('aprobadas por motivo y rechazos por jefe, más horas primero', () => {
		const r = motivosPorJefe([
			f(1, 'aprobada', 60, 1, 'a'),
			f(2, 'aprobada', 30, 1, 'a'),
			f(1, 'aprobada', 300, 2, 'b'),
			f(1, 'descartada_comercial', 60, 1, 'b'),
			f(1, 'pendiente', 60, 1, 'b'),
		]);
		expect(r.map((j) => j.creadaPor)).toEqual(['b', 'a']);
		expect(r[0].rechazadas).toEqual({ registros: 1, minutos: 60 });
		expect(r[0].aprobadas).toEqual({ registros: 2, minutos: 300 });
		expect([...r[1].porMotivo]).toEqual([
			[1, 60],
			[2, 30],
		]);
	});
});
