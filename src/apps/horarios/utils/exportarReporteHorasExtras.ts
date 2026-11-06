import dayjs from 'dayjs';
import {
	ESTADO_PERIODO,
	type JefeMotivos,
	type RechazoMotivo,
	type ReporteMotivos,
	type ReporteZona,
	type ResumenPeriodo,
} from '../domain/horasExtras';
import type { PeriodDto } from '../interfaces/api/period';

const fecha = (f: string) => dayjs(f).format('DD/MM/YYYY');
const horas = (minutos: number) => minutos / 60;

/**
 * Un periodo **liquidado** del reporte en tiempo real a Excel: resumen y detalle por
 * tienda. Horas en decimal. Los preliquidados no se exportan (números preliminares).
 */
export async function exportarReporteTiempoRealExcel(
	r: ResumenPeriodo<PeriodDto>,
	tiendaDe: (storeId: number | null) => { name: string; company?: string },
	empresa: string,
	tienda = '',
) {
	if (r.periodo.status !== ESTADO_PERIODO.liquidado)
		throw new Error('Solo se pueden exportar periodos liquidados');
	const [excelModule, { saveAs }] = await Promise.all([
		import('exceljs'),
		import('file-saver'),
	]);
	const ExcelJS = (excelModule.default ||
		excelModule) as typeof import('exceljs');
	const workbook = new ExcelJS.Workbook();
	const ws = workbook.addWorksheet('Periodo');
	ws.columns = [
		{ width: 28 },
		{ width: 22 },
		{ width: 18 },
		{ width: 14 },
		{ width: 14 },
	];
	const nombre = r.periodo.name || 'Sin nombre';
	ws.addRow([`Horas extras liquidadas · ${nombre}`]).font = {
		bold: true,
		size: 14,
		color: { argb: 'FF004680' },
	};
	ws.addRow([
		`Del ${fecha(r.periodo.start_date)} al ${fecha(r.periodo.end_date)}`,
		r.periodo.liquidacion_at
			? `Liquidado el ${dayjs(r.periodo.liquidacion_at).format('DD/MM/YYYY HH:mm')}`
			: '',
	]);
	ws.addRow([
		`Empresa: ${empresa || 'Todas'}${tienda ? `, tienda: ${tienda}` : ''}`,
		`Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}`,
	]).font = { italic: true, color: { argb: 'FF64748B' } };
	ws.addRow([]);
	for (const [titulo, t] of [
		['Horas del periodo', r.delPeriodo],
		['Rezagadas', r.rezagadas],
		['Total liquidado', r.total],
	] as const) {
		const fila = ws.addRow([
			titulo,
			horas(t.minutos),
			`${t.registros} registros`,
		]);
		fila.getCell(1).font = { bold: true };
		fila.getCell(2).numFmt = '0.00';
	}
	ws.addRow([]);
	const cab = ws.addRow([
		'Tienda',
		'Empresa',
		'Horas del periodo',
		'Rezagadas',
		'Total horas',
	]);
	cab.eachCell((c) => {
		c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		c.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF004680' },
		};
	});
	for (const t of r.tiendas) {
		const { name, company } = tiendaDe(t.storeId);
		const fila = ws.addRow([
			name,
			company ?? '',
			horas(t.delPeriodo.minutos),
			horas(t.rezagadas.minutos),
			horas(t.total.minutos),
		]);
		for (const i of [3, 4, 5]) fila.getCell(i).numFmt = '0.00';
	}
	const buffer = await workbook.xlsx.writeBuffer();
	saveAs(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		}),
		`Horas_Extras_${nombre.replace(/\W+/g, '_')}_${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`,
	);
}

/**
 * Reporte por zona a Excel: hojas **Tiendas** (ranking), **Personas** (por tienda)
 * y **Días** (persona por día). Horas en decimal.
 */
export async function exportarReporteZonaExcel({
	reporte,
	zona,
	desde,
	hasta,
	nombreTienda,
	persona,
}: {
	reporte: ReporteZona;
	zona: string;
	desde: string;
	hasta: string;
	nombreTienda: (id: number) => string;
	persona: (id: number) => {
		nombre: string;
		documento: string;
		cargo?: string;
	};
}) {
	const [excelModule, { saveAs }] = await Promise.all([
		import('exceljs'),
		import('file-saver'),
	]);
	const ExcelJS = (excelModule.default ||
		excelModule) as typeof import('exceljs');
	const workbook = new ExcelJS.Workbook();
	const hoja = (nombre: string, columnas: string[], anchos: number[]) => {
		const ws = workbook.addWorksheet(nombre);
		ws.columns = anchos.map((width) => ({ width }));
		ws.addRow([`Horas extras aprobadas · Zona ${zona}`]).font = {
			bold: true,
			size: 14,
			color: { argb: 'FF004680' },
		};
		ws.addRow([`Del ${fecha(desde)} al ${fecha(hasta)}`]).font = {
			italic: true,
			color: { argb: 'FF64748B' },
		};
		ws.addRow([]);
		ws.addRow(columnas).eachCell((c) => {
			c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			c.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FF004680' },
			};
		});
		return ws;
	};
	const numero = (
		ws: import('exceljs').Worksheet,
		valores: unknown[],
		cols: number[],
	) => {
		const r = ws.addRow(valores);
		for (const c of cols) r.getCell(c).numFmt = '0.00';
	};

	const tiendas = hoja(
		'Tiendas',
		[
			'Tienda',
			'Total horas',
			'% de la zona',
			'Registros',
			'Personas',
			'Horas por persona (plantilla)',
		],
		[28, 14, 14, 12, 12, 26],
	);
	for (const t of reporte.tiendas) {
		const r = tiendas.addRow([
			nombreTienda(t.storeId),
			horas(t.minutos),
			t.porcentaje,
			t.registros,
			t.personas.length,
			t.minutosPorPersona == null ? '' : horas(t.minutosPorPersona),
		]);
		r.getCell(2).numFmt = '0.00';
		r.getCell(3).numFmt = '0.0%';
		r.getCell(6).numFmt = '0.00';
	}
	numero(
		tiendas,
		[
			'Total',
			horas(reporte.total.minutos),
			1,
			reporte.total.registros,
			reporte.total.personas,
		],
		[2],
	);

	const personas = hoja(
		'Personas',
		[
			'Tienda',
			'Empleado / asesor',
			'Documento',
			'Cargo',
			'Total horas',
			'Registros',
			'Días con horas',
		],
		[28, 36, 18, 24, 14, 12, 16],
	);
	const dias = hoja(
		'Días',
		[
			'Tienda',
			'Empleado / asesor',
			'Documento',
			'Cargo',
			'Fecha',
			'Total horas',
		],
		[28, 36, 18, 24, 14, 14],
	);
	for (const t of reporte.tiendas)
		for (const p of t.personas) {
			const { nombre, documento, cargo } = persona(p.empleadoId);
			const elCargo = cargo || 'Sin cargo';
			numero(
				personas,
				[
					nombreTienda(t.storeId),
					nombre,
					documento,
					elCargo,
					horas(p.minutos),
					p.registros,
					p.dias.length,
				],
				[5],
			);
			for (const d of p.dias)
				numero(
					dias,
					[
						nombreTienda(t.storeId),
						nombre,
						documento,
						elCargo,
						fecha(d.fecha),
						horas(d.minutos),
					],
					[6],
				);
		}

	const buffer = await workbook.xlsx.writeBuffer();
	saveAs(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		}),
		`Horas_Extras_Zona_${zona.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`,
	);
}

/**
 * Reporte por motivo a Excel: hojas **Motivos**, **Rechazos** (si se pasan) y
 * **Jefes de zona** (horas aprobadas por motivo). Horas en decimal.
 */
export async function exportarReporteMotivosExcel({
	filtro,
	reporte,
	rechazos,
	jefes,
	columnasJefe,
	nombreMotivo,
	nombreJefe,
}: {
	filtro: string;
	reporte: ReporteMotivos;
	rechazos: RechazoMotivo[] | null;
	jefes: JefeMotivos[];
	columnasJefe: (number | null)[];
	nombreMotivo: (id: number | null) => string;
	nombreJefe: (id: string | null) => string;
}) {
	const [excelModule, { saveAs }] = await Promise.all([
		import('exceljs'),
		import('file-saver'),
	]);
	const ExcelJS = (excelModule.default ||
		excelModule) as typeof import('exceljs');
	const workbook = new ExcelJS.Workbook();
	const hoja = (nombre: string, columnas: string[]) => {
		const ws = workbook.addWorksheet(nombre);
		ws.columns = columnas.map((c, i) => ({
			width: i ? Math.max(14, c.length + 2) : 30,
		}));
		ws.addRow([`Horas extras por motivo · ${filtro}`]).font = {
			bold: true,
			size: 14,
			color: { argb: 'FF004680' },
		};
		ws.addRow([`Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}`]).font = {
			italic: true,
			color: { argb: 'FF64748B' },
		};
		ws.addRow([]);
		ws.addRow(columnas).eachCell((c) => {
			c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			c.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FF004680' },
			};
		});
		return ws;
	};
	const formato = (
		r: import('exceljs').Row,
		horasEn: number[],
		pctEn: number[] = [],
	) => {
		for (const c of horasEn) r.getCell(c).numFmt = '0.00';
		for (const c of pctEn) r.getCell(c).numFmt = '0.0%';
	};

	const motivos = hoja('Motivos', [
		'Motivo',
		'Horas aprobadas',
		'% de las horas',
		'Registros aprobados',
		'Horas pendientes',
		'Horas rechazadas',
		'Se aprueban',
	]);
	for (const m of reporte.motivos)
		formato(
			motivos.addRow([
				nombreMotivo(m.motivoId),
				horas(m.aprobadas.minutos),
				m.porcentaje,
				m.aprobadas.registros,
				horas(m.pendientes.minutos),
				horas(m.rechazadas.minutos),
				m.tasaAprobacion ?? '',
			]),
			[2, 5, 6],
			[3, 7],
		);
	const total = motivos.addRow([
		'Total',
		horas(reporte.aprobadas.minutos),
		1,
		reporte.aprobadas.registros,
		horas(reporte.pendientes.minutos),
		horas(reporte.rechazadas.minutos),
		reporte.tasaAprobacion ?? '',
	]);
	total.font = { bold: true };
	formato(total, [2, 5, 6], [3, 7]);

	if (rechazos) {
		const ws = hoja('Rechazos', [
			'Motivo del rechazo',
			'Registros',
			'Horas',
			'% de los rechazos',
		]);
		for (const r of rechazos)
			formato(
				ws.addRow([
					nombreMotivo(r.motivoId),
					r.registros,
					horas(r.minutos),
					r.porcentaje,
				]),
				[3],
				[4],
			);
	}

	if (jefes.length > 0) {
		const ws = hoja('Jefes de zona', [
			'Jefe de zona',
			...columnasJefe.map(nombreMotivo),
			'Total aprobadas',
			'Horas rechazadas',
			'Registros rechazados',
		]);
		const n = columnasJefe.length;
		for (const j of jefes)
			formato(
				ws.addRow([
					nombreJefe(j.creadaPor),
					...columnasJefe.map((id) => horas(j.porMotivo.get(id) ?? 0)),
					horas(j.aprobadas.minutos),
					horas(j.rechazadas.minutos),
					j.rechazadas.registros,
				]),
				Array.from({ length: n + 2 }, (_, i) => i + 2),
			);
	}

	const buffer = await workbook.xlsx.writeBuffer();
	saveAs(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		}),
		`Horas_Extras_Motivos_${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`,
	);
}
