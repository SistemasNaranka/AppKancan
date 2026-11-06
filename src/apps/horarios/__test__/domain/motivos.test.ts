import { describe, expect, it } from 'vitest';
import { aMotivo } from '@/apps/horarios/api/directus/motivos';
import {
	type Motivo,
	motivosParaElegir,
	textoDelMotivo,
	validarMotivo,
} from '@/apps/horarios/domain/horasExtras';

const m = (id: number, nombre: string, extra: Partial<Motivo> = {}): Motivo => ({
	id,
	nombre,
	descripcion: '',
	tipo: 'solicitud',
	pideTexto: false,
	activo: true,
	orden: id,
	...extra,
});
const otros = m(99, 'Otros', { pideTexto: true });

describe('motivosParaElegir', () => {
	it('solo los activos del tipo, en el orden del catálogo', () => {
		const lista = [
			otros,
			m(2, 'Inventario'),
			m(1, 'Fuerza mayor'),
			m(3, 'Viejo', { activo: false }),
			m(4, 'No autorizada', { tipo: 'rechazo' }),
		];
		expect(motivosParaElegir(lista, 'solicitud').map((x) => x.nombre)).toEqual([
			'Fuerza mayor',
			'Inventario',
			'Otros',
		]);
		expect(motivosParaElegir(lista, 'rechazo').map((x) => x.nombre)).toEqual(['No autorizada']);
	});
});

describe('validarMotivo', () => {
	it('el motivo es obligatorio', () => {
		expect(validarMotivo(undefined, '')).toEqual({ motivo: 'Elige un motivo' });
	});

	it('"Otros" exige el texto; los demás no', () => {
		expect(validarMotivo(otros, '   ')).toEqual({ texto: 'Escribe el motivo' });
		expect(validarMotivo(otros, 'Visita de auditoría')).toEqual({});
		expect(validarMotivo(m(1, 'Fuerza mayor'), '')).toEqual({});
	});

	it('limita el largo del texto', () => {
		expect(validarMotivo(otros, 'x'.repeat(301)).texto).toMatch(/Máximo/);
	});
});

describe('textoDelMotivo', () => {
	it('solo se guarda el texto del motivo que lo pide', () => {
		expect(textoDelMotivo(otros, ' Auditoría ')).toBe('Auditoría');
		expect(textoDelMotivo(m(1, 'Fuerza mayor'), 'texto que quedó escrito')).toBe('');
	});
});

describe('aMotivo (catálogo de Directus)', () => {
	it('mapea los campos y descarta tipos desconocidos', () => {
		expect(
			aMotivo({ id: 4, name: ' Otros ', description: null, type: 'solicitud', requires_note: true, status: 'active', sort: 99 }),
		).toEqual({ id: 4, nombre: 'Otros', descripcion: '', tipo: 'solicitud', pideTexto: true, activo: true, orden: 99 });
		expect(aMotivo({ id: 5, name: 'X', type: 'rechazo', status: 'inactive' })?.activo).toBe(false);
		expect(aMotivo({ id: 6, name: 'X', type: 'otro' })).toBeNull();
	});
});
