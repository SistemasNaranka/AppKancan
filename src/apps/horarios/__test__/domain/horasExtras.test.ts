import { describe, expect, it } from 'vitest';
import {
	buscarDuplicado,
	ESTADO_HORA_EXTRA as E,
	esBloquePermitido,
	esEstadoFinal,
	esEstadoHoraExtra,
	formatoMinutos,
	fueraDeBloque,
	puedeTransicionar,
	validarHoraExtra,
	valoresRapidos,
} from '@/apps/horarios/domain/horasExtras';

const ctx = { hoy: '2026-10-20', empleadoActivo: true, empleadoDelLider: true };
const valida = { workDate: '2026-10-19', minutos: 90 };

describe('validarHoraExtra', () => {
	it('acepta un día pasado o de hoy en bloques de 30 min', () => {
		expect(validarHoraExtra(valida, ctx)).toEqual({});
		expect(
			validarHoraExtra({ ...valida, workDate: '2026-10-20' }, ctx),
		).toEqual({});
	});

	it('rechaza fechas futuras o vacías', () => {
		expect(
			validarHoraExtra({ ...valida, workDate: '2026-10-21' }, ctx).workDate,
		).toMatch(/futuros/);
		expect(
			validarHoraExtra({ ...valida, workDate: '' }, ctx).workDate,
		).toBeDefined();
	});

	it('exige minutos > 0 y múltiplos de 15', () => {
		expect(validarHoraExtra({ ...valida, minutos: 0 }, ctx).minutos).toMatch(
			/mayores/,
		);
		expect(validarHoraExtra({ ...valida, minutos: -30 }, ctx).minutos).toMatch(
			/mayores/,
		);
		expect(
			validarHoraExtra({ ...valida, minutos: 45 }, ctx).minutos,
		).toBeUndefined();
		expect(
			validarHoraExtra({ ...valida, minutos: 75 }, ctx).minutos,
		).toBeUndefined();
		expect(validarHoraExtra({ ...valida, minutos: 70 }, ctx).minutos).toBe(
			'Las horas extras van en bloques de 15 min (0.25 h)',
		);
		expect(
			validarHoraExtra({ ...valida, minutos: 30.5 }, ctx).minutos,
		).toBeDefined();
	});

	it('usa el bloque configurado', () => {
		const c30 = { ...ctx, bloque: 30 };
		expect(
			validarHoraExtra({ ...valida, minutos: 90 }, c30).minutos,
		).toBeUndefined();
		expect(validarHoraExtra({ ...valida, minutos: 45 }, c30).minutos).toBe(
			'Las horas extras van en bloques de 30 min (0.5 h)',
		);
		expect(
			validarHoraExtra({ ...valida, minutos: 60 }, { ...ctx, bloque: 60 })
				.minutos,
		).toBeUndefined();
	});

	it('bloques permitidos y valores rápidos derivados', () => {
		expect([15, 30, 60].map(esBloquePermitido)).toEqual([true, true, true]);
		expect([20, '15', null].map(esBloquePermitido)).toEqual([
			false,
			false,
			false,
		]);
		expect(valoresRapidos(15)).toEqual([15, 30, 60, 90, 120, 180]);
		expect(valoresRapidos(30)).toEqual([30, 60, 120, 180, 240, 360]);
	});

	it('cuenta las pendientes que no cuadran con un bloque nuevo', () => {
		const pendientes = new Map([
			[45, 2],
			[60, 3],
			[90, 1],
		]);
		expect(fueraDeBloque(pendientes, 30)).toBe(2);
		expect(fueraDeBloque(pendientes, 60)).toBe(3);
		expect(fueraDeBloque(pendientes, 15)).toBe(0);
	});

	it('exige empleado activo y de las tiendas del líder', () => {
		expect(
			validarHoraExtra(valida, { ...ctx, empleadoActivo: false }).empleado,
		).toMatch(/activo/);
		expect(
			validarHoraExtra(valida, { ...ctx, empleadoDelLider: false }).empleado,
		).toMatch(/tiendas/);
	});

	it('limita la observación a 300 caracteres', () => {
		expect(
			validarHoraExtra({ ...valida, observacion: 'x'.repeat(301) }, ctx)
				.observacion,
		).toBeDefined();
	});
});

describe('transiciones', () => {
	it('el líder crea en pendiente y gestiona sugeridas', () => {
		expect(puedeTransicionar('lider', null, E.pendiente)).toBe(true);
		expect(puedeTransicionar('lider', E.sugerida, E.pendiente)).toBe(true);
		expect(puedeTransicionar('lider', E.sugerida, E.descartadaLider)).toBe(
			true,
		);
		expect(puedeTransicionar('lider', E.pendiente, E.pendiente)).toBe(true);
	});

	it('el líder no retira pendientes ni aprueba (P6)', () => {
		expect(puedeTransicionar('lider', E.pendiente, E.descartadaLider)).toBe(
			false,
		);
		expect(puedeTransicionar('lider', E.pendiente, E.aprobada)).toBe(false);
	});

	it('el comercial solo decide sobre pendientes', () => {
		expect(puedeTransicionar('comercial', E.pendiente, E.aprobada)).toBe(true);
		expect(
			puedeTransicionar('comercial', E.pendiente, E.descartadaComercial),
		).toBe(true);
		expect(puedeTransicionar('comercial', E.sugerida, E.aprobada)).toBe(false);
		expect(puedeTransicionar('comercial', null, E.pendiente)).toBe(false);
	});

	it('los estados finales no tienen salida', () => {
		for (const final of [
			E.aprobada,
			E.descartadaComercial,
			E.descartadaLider,
		]) {
			expect(esEstadoFinal(final)).toBe(true);
			for (const a of Object.values(E)) {
				expect(puedeTransicionar('lider', final, a)).toBe(false);
				expect(puedeTransicionar('comercial', final, a)).toBe(false);
			}
		}
	});

	it('reconoce solo los valores del catálogo', () => {
		expect(esEstadoHoraExtra('pendiente')).toBe(true);
		expect(esEstadoHoraExtra('Req')).toBe(false);
	});
});

describe('buscarDuplicado y formatoMinutos', () => {
	it('solo cuentan las activas y no la propia fila', () => {
		const filas = [
			{ id: 1, status: E.descartadaComercial },
			{ id: 2, status: E.pendiente },
		];
		expect(buscarDuplicado(filas)?.id).toBe(2);
		expect(buscarDuplicado(filas, 2)).toBeUndefined();
	});

	it('formatea minutos', () => {
		expect(formatoMinutos(30)).toBe('30 min');
		expect(formatoMinutos(120)).toBe('2 h');
		expect(formatoMinutos(90)).toBe('1 h 30 min');
	});
});
