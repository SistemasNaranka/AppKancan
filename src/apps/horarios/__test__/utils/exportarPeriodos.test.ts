import { describe, expect, it } from 'vitest';
import type { PeriodDto } from '@/apps/horarios/interfaces/api/period';
import { hojasExportacionPeriodos } from '@/apps/horarios/utils/exportarPeriodos';

const p1: PeriodDto = { id: 1, name: 'Oct 1', start_date: '2026-10-01', end_date: '2026-10-15', status: 'liquidado' };
const p2: PeriodDto = { id: 2, start_date: '2026-10-16', end_date: '2026-10-30', status: 'preliquidado' };
const tiendas = [
	{ id: 26, name: 'Ipiales', company: 'Empresa A' },
	{ id: 30, name: 'Pasto', company: 'Empresa B' },
	{ id: 40, name: 'Sin dueña' },
];
const h = (id: number, emp: number, tienda: number, minutes: number) => ({
	id,
	employee_id: { id: emp, first_name: `EMP${emp}`, last_name: 'X', document_number: `10${emp}`, store_id: 26 },
	store_id: { id: tienda, name: tiendas.find((t) => t.id === tienda)!.name },
	work_date: '2026-10-05',
	minutes,
	status: 'aprobada' as const,
});

describe('hojasExportacionPeriodos', () => {
	const hojas = hojasExportacionPeriodos(
		[
			{ periodo: p1, horas: [h(1, 7, 26, 60), h(2, 7, 26, 30), h(3, 7, 30, 60), h(4, 8, 40, 90)] },
			{ periodo: p2, horas: [h(5, 8, 26, 120)] },
		],
		tiendas,
	);

	it('una hoja por empresa de la tienda trabajada; "Sin empresa" al final', () => {
		expect(hojas.map((x) => x.empresa)).toEqual(['Empresa A', 'Empresa B', 'Sin empresa']);
	});

	it('cada hoja tiene un bloque por periodo, con filas por empleado + tienda y totales', () => {
		const a = hojas[0];
		expect(a.bloques.map((b) => b.periodo.id)).toEqual([1, 2]);
		expect(a.bloques[0].filas).toEqual([
			{ empleado: 'Emp7 X', documento: '107', cargo: '', tienda: 'Ipiales', motivo: 'Sin motivo (histórico)', horasExtras: 2, minutos: 90 },
		]);
		expect(a.bloques[0].totales).toEqual({ horasExtras: 2, minutos: 90, empleados: 1 });
		expect(a.bloques[1].filas[0]).toMatchObject({ empleado: 'Emp8 X', minutos: 120 });

		// El mismo empleado en otra empresa (rotación) va a la otra hoja.
		expect(hojas[1].bloques[0].filas).toEqual([
			{ empleado: 'Emp7 X', documento: '107', cargo: '', tienda: 'Pasto', motivo: 'Sin motivo (histórico)', horasExtras: 1, minutos: 60 },
		]);
		// Periodo sin horas de esa empresa: bloque vacío.
		expect(hojas[1].bloques[1].filas).toEqual([]);
	});

	it('separa las filas de una persona por motivo', () => {
		const p = { id: 1, name: 'P', start_date: '2026-10-01', end_date: '2026-10-15', status: 'liquidado' } as const;
		const h = (id: number, motivo: { id: number; name: string } | null, minutes: number) =>
			({
				id,
				employee_id: { id: 7, first_name: 'Emp7', last_name: 'X', document_number: '107' },
				store_id: { id: 26, name: 'Ipiales' },
				work_date: '2026-10-02',
				minutes,
				status: 'aprobada',
				reason_id: motivo,
			}) as never;
		const [hoja] = hojasExportacionPeriodos(
			[{ periodo: p as never, horas: [h(1, { id: 1, name: 'Fuerza mayor' }, 60), h(2, { id: 2, name: 'Toma física de inventario' }, 30), h(3, { id: 1, name: 'Fuerza mayor' }, 30)] }],
			[{ id: 26, name: 'Ipiales', company: 'Empresa A' }],
		);
		expect(hoja.bloques[0].filas.map((f) => [f.motivo, f.minutos])).toEqual([
			['Fuerza mayor', 90],
			['Toma física de inventario', 30],
		]);
		expect(hoja.bloques[0].totales.empleados).toBe(1);
	});
});
