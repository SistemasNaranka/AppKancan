import { describe, expect, it } from 'vitest';
import { aMotivo } from '@/apps/horarios/api/directus/motivos';
import {
	hayCupoMotivo,
	MAX_MOTIVOS_ACTIVOS,
	type Motivo,
	motivosParaElegir,
	ordenNuevoMotivo,
	textoDelMotivo,
	validarMotivo,
	validarNuevoMotivo,
} from '@/apps/horarios/domain/horasExtras';

const m = (
	id: number,
	nombre: string,
	extra: Partial<Motivo> = {},
): Motivo => ({
	id,
	nombre,
	descripcion: '',
	tipo: 'solicitud',
	pideTexto: false,
	activo: true,
	orden: id,
	sistema: false,
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
		expect(motivosParaElegir(lista, 'rechazo').map((x) => x.nombre)).toEqual([
			'No autorizada',
		]);
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
		expect(
			textoDelMotivo(m(1, 'Fuerza mayor'), 'texto que quedó escrito'),
		).toBe('');
	});
});

describe('aMotivo (catálogo de Directus)', () => {
	it('mapea los campos y descarta tipos desconocidos', () => {
		expect(
			aMotivo({
				id: 4,
				name: ' Otros ',
				description: null,
				type: 'solicitud',
				requires_note: true,
				status: 'active',
				sort: 99,
				is_system: true,
			}),
		).toEqual({
			id: 4,
			nombre: 'Otros',
			descripcion: '',
			tipo: 'solicitud',
			pideTexto: true,
			activo: true,
			orden: 99,
			sistema: true,
		});
		expect(aMotivo({ id: 7, name: 'Nuevo', type: 'rechazo' })?.sistema).toBe(
			false,
		);
		expect(
			aMotivo({ id: 5, name: 'X', type: 'rechazo', status: 'inactive' })
				?.activo,
		).toBe(false);
		expect(aMotivo({ id: 6, name: 'X', type: 'otro' })).toBeNull();
	});
});

describe('opciones nuevas (Admin)', () => {
	const lista = [
		m(1, 'Fuerza mayor', { sistema: true }),
		m(2, 'Toma física de inventario', { sistema: true }),
		{ ...otros, sistema: true },
	];

	it('nombre requerido, con largo máximo y sin repetir (ni por mayúsculas ni tildes)', () => {
		expect(
			validarNuevoMotivo({ nombre: '  ', descripcion: '' }, lista),
		).toEqual({ nombre: 'Escribe el nombre' });
		expect(
			validarNuevoMotivo({ nombre: 'x'.repeat(61), descripcion: '' }, lista)
				.nombre,
		).toBe('Máximo 60 caracteres');
		expect(
			validarNuevoMotivo(
				{ nombre: ' toma  fisica de INVENTARIO', descripcion: '' },
				lista,
			).nombre,
		).toBe('Ya existe un motivo con ese nombre');
		expect(
			validarNuevoMotivo(
				{ nombre: 'Auditoría', descripcion: 'd'.repeat(151) },
				lista,
			),
		).toEqual({
			descripcion: 'Máximo 150 caracteres',
		});
		// Al editar, su propio nombre no cuenta como repetido.
		const propio = m(10, 'Auditoría');
		expect(
			validarNuevoMotivo(
				{ nombre: 'auditoria', descripcion: '' },
				[...lista, propio],
				10,
			),
		).toEqual({});
	});

	it('va después de los demás y antes de "Otros"', () => {
		expect(ordenNuevoMotivo(lista)).toBe(3);
		expect(ordenNuevoMotivo([...lista, m(10, 'Auditoría')])).toBe(11);
		expect(ordenNuevoMotivo([...lista, m(98, 'Tope')])).toBe(98);
	});

	it(`máximo ${MAX_MOTIVOS_ACTIVOS} activos por lista; los inactivos no cuentan`, () => {
		const nueve = Array.from({ length: 9 }, (_, i) => m(i + 1, `M${i}`));
		expect(hayCupoMotivo(nueve)).toBe(true);
		expect(hayCupoMotivo([...nueve, m(20, 'Uno más')])).toBe(false);
		expect(
			hayCupoMotivo([...nueve, m(20, 'Inactivo', { activo: false })]),
		).toBe(true);
	});
});
