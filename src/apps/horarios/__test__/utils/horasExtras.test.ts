import { describe, expect, it } from 'vitest';
import type { OverTimeDto } from '@/apps/horarios/interfaces/api/overTime';
import { idRelacion } from '@/apps/horarios/api/directus/relacion';
import { aFilaHoraExtra, coincideEmpleado } from '@/apps/horarios/utils/horasExtras';

const base: OverTimeDto = {
	id: 1,
	employee_id: { id: 7, first_name: 'ANA MARÍA', last_name: 'PÉREZ', document_number: '1107837464', store_id: 26 },
	store_id: { id: '26', name: 'Ipiales Centro' },
	work_date: '2026-10-10',
	minutes: 90,
	status: 'pendiente',
	observations: 'Inventario',
	created_by: { id: 'u1', first_name: 'luis', last_name: 'gómez' },
	created_at: '2026-10-11T14:00:00Z',
};

describe('aFilaHoraExtra', () => {
	it('resuelve nombres, documento y tienda', () => {
		expect(aFilaHoraExtra(base)).toMatchObject({
			id: 1,
			fecha: '2026-10-10',
			empleado: 'Ana María Pérez',
			documento: '1 107 837 464',
			tiendaId: 26,
			tienda: 'Ipiales Centro',
			rotacion: false,
			minutos: 90,
			creadaPor: 'Luis Gómez',
		});
	});

	it('marca rotación cuando la tienda trabajada no es la del empleado (ids texto o número)', () => {
		expect(aFilaHoraExtra({ ...base, store_id: { id: '90', name: 'Oficina' } }).rotacion).toBe(true);
	});

	it('periodo: expandido, solo id o sin vincular', () => {
		expect(aFilaHoraExtra(base).periodo).toBeNull();
		// Directus manda `null` (no ausente) cuando no hay periodo: no es el "Periodo 0".
		expect(aFilaHoraExtra({ ...base, period_id: null }).periodo).toBeNull();
		expect(
			aFilaHoraExtra({
				...base,
				period_id: { id: 4, name: 'Quincena 1', start_date: '2026-10-01', end_date: '2026-10-15' },
			}).periodo,
		).toEqual({ id: 4, nombre: 'Quincena 1', inicio: '2026-10-01', fin: '2026-10-15' });
		expect(aFilaHoraExtra({ ...base, period_id: 4 }).periodo).toEqual({ id: 4, nombre: '', inicio: '', fin: '' });
	});

	it('motivos: nombre del de solicitud y del de revisión; horas viejas sin motivo', () => {
		const f = aFilaHoraExtra({
			...base,
			reason_id: { id: 4, name: 'Otros' },
			observations: 'Visita de auditoría',
			review_reason_id: { id: 7, name: 'No autorizada' },
		});
		expect(f).toMatchObject({ motivo: 'Otros', observacion: 'Visita de auditoría', motivoRevision: 'No autorizada' });
		expect(aFilaHoraExtra({ ...base, reason_id: null })).toMatchObject({ motivo: '', motivoRevision: '' });
	});

	it('revisión: solo con reviewed_at se toma updated_by como revisor', () => {
		const revisada = aFilaHoraExtra({
			...base,
			status: 'descartada_comercial',
			updated_by: { id: 'u2', first_name: 'marta', last_name: 'ríos' },
			reviewed_at: '2026-10-12T10:00:00Z',
			review_note: 'Sin soporte',
		});
		expect(revisada).toMatchObject({ revisadaPor: 'Marta Ríos', revisadaEl: '2026-10-12T10:00:00Z', motivoRechazo: 'Sin soporte' });
		// Pendiente editada: updated_by no es un revisor.
		expect(aFilaHoraExtra({ ...base, updated_by: { id: 'u1', first_name: 'luis' } }).revisadaPor).toBe('');
		// Liquidada: sigue mostrando a quien aprobó (updated_by lo escribe la revisión).
		expect(
			aFilaHoraExtra({
				...base,
				status: 'aprobada',
				reviewed_at: '2026-10-12T10:00:00Z',
				updated_by: { id: 'u2', first_name: 'marta', last_name: 'ríos' },
				period_id: { id: 4, start_date: '2026-10-01', end_date: '2026-10-15' },
			}).revisadaPor,
		).toBe('Marta Ríos');
	});

	it('tolera relaciones sin expandir', () => {
		const f = aFilaHoraExtra({ ...base, employee_id: 7, store_id: 26, created_by: 'u1', observations: null });
		expect(f).toMatchObject({ empleado: 'Empleado 7', tienda: '', rotacion: false, creadaPor: '', observacion: '' });
	});
});

describe('idRelacion', () => {
	it('una relación vacía es null, no el id 0', () => {
		expect(idRelacion(null)).toBeNull();
		expect(idRelacion(undefined)).toBeNull();
		expect(idRelacion('')).toBeNull();
		expect(idRelacion({ id: null })).toBeNull();
		expect(idRelacion({ id: '26' })).toBe(26);
		expect(idRelacion(4)).toBe(4);
	});
});

describe('coincideEmpleado', () => {
	const ana = { empleado: 'Ana María Pérez', documento: '1 107 837 464' };
	it('por nombre sin tildes ni mayúsculas', () => {
		expect(coincideEmpleado(ana, 'maria perez')).toBe(true);
		expect(coincideEmpleado(ana, 'jose')).toBe(false);
	});
	it('por documento ignorando espacios y puntos', () => {
		expect(coincideEmpleado(ana, '1107837')).toBe(true);
		expect(coincideEmpleado(ana, '1.107.837.464')).toBe(true);
		expect(coincideEmpleado(ana, '999')).toBe(false);
	});
	it('vacío: todos', () => {
		expect(coincideEmpleado(ana, '  ')).toBe(true);
	});
});

