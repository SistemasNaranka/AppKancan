import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
	Alert,
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { type ReactNode, useState } from 'react';
import { formatoMinutos, SIN_MOTIVO } from '../../domain/horasExtras';
import { useAvisos } from '../../hooks/useAvisos';
import { useZonas } from '../../hooks/useReporteHorasExtras';
import { useReporteMotivos } from '../../hooks/useReporteMotivos';
import { mensajeDeError } from '../../utils/errores';
import { exportarReporteMotivosExcel } from '../../utils/exportarReporteHorasExtras';
import {
	AZUL,
	Bloque,
	BORDE,
	Cargando,
	Filtros,
	GRIS,
	horasCortas,
	Kpi,
	Kpis,
	pct,
	TACTIL,
} from './gerencia/bloques';
import {
	type ModoTiempo,
	SelectorTiempo,
	useSelectorTiempo,
} from './gerencia/SelectorTiempo';

export type PerfilMotivos = 'comercial' | 'nomina' | 'jefe' | 'gerencia';

/**
 * Qué ve cada perfil, igual que en sus otros reportes: Comercial revisa (rechazos,
 * pendientes, jefes y Excel); Nómina paga (aprobadas, jefes y Excel); el jefe de
 * zona ve lo suyo; Gerencia, solo indicadores y gráficas, sin personas ni descargas.
 */
const PERFIL: Record<
	PerfilMotivos,
	{
		modos: ModoTiempo[];
		rechazos: boolean;
		pendientes: boolean;
		tabla: boolean;
		jefes: boolean;
		excel: boolean;
	}
> = {
	comercial: {
		modos: ['rango', 'periodo', 'mes'],
		rechazos: true,
		pendientes: true,
		tabla: true,
		jefes: true,
		excel: true,
	},
	nomina: {
		modos: ['periodo', 'mes', 'rango'],
		rechazos: false,
		pendientes: false,
		tabla: true,
		jefes: true,
		excel: true,
	},
	jefe: {
		modos: ['rango', 'periodo', 'mes'],
		rechazos: true,
		pendientes: true,
		tabla: true,
		jefes: false,
		excel: false,
	},
	gerencia: {
		modos: ['periodo', 'mes'],
		rechazos: true,
		pendientes: false,
		tabla: false,
		jefes: false,
		excel: false,
	},
};

const TODAS = '';
const ROJO = '#b91c1c';
const head = { fontWeight: 700, color: '#1e293b', bgcolor: '#f0f7ff' };
const fila = {
	'& td': { py: 1.25, px: { xs: 1, sm: 2 } },
	'& td:first-of-type': { wordBreak: 'break-word' },
};
const horasDecimal = (minutos: number) => Math.round(minutos / 6) / 10;

function Tabla({
	titulo,
	columnas,
	children,
}: {
	titulo: string;
	columnas: string[];
	children: ReactNode;
}) {
	return (
		<TableContainer sx={{ borderRadius: 2, border: BORDE, bgcolor: '#fff' }}>
			<Table size="small" aria-label={titulo}>
				<TableHead>
					<TableRow>
						{columnas.map((c, i) => (
							<TableCell key={c} sx={head} align={i ? 'right' : 'left'}>
								{c}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>{children}</TableBody>
			</Table>
		</TableContainer>
	);
}

interface Indicador {
	nombre: string;
	valor: string;
	nota: string;
}

/** Barras horizontales (un motivo por barra) y, si se pasan, los mismos datos en una lista corta. */
function Barras({
	titulo,
	nombres,
	valores,
	unidad,
	color,
	tarjetas,
}: {
	titulo: string;
	nombres: string[];
	valores: number[];
	unidad: (v: number) => string;
	color: string;
	tarjetas?: Indicador[];
}) {
	return (
		<Box
			sx={{
				p: 2,
				borderRadius: 2,
				border: BORDE,
				bgcolor: '#fff',
				minWidth: 0,
			}}
		>
			<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
				{titulo}
			</Typography>
			{valores.length === 0 ? (
				<Typography variant="body2" sx={{ color: GRIS, py: 3 }}>
					Sin datos en este filtro.
				</Typography>
			) : (
				<BarChart
					height={50 + nombres.length * 36}
					layout="horizontal"
					yAxis={[{ scaleType: 'band', data: nombres, width: 120 }]}
					series={[
						{
							data: valores,
							label: titulo,
							color,
							valueFormatter: (v) => unidad(v ?? 0),
						},
					]}
					barLabel={(item) => unidad(item.value ?? 0)}
					hideLegend
				/>
			)}
			{tarjetas && tarjetas.length > 0 && (
				<Box
					component="ul"
					aria-label={titulo}
					sx={{ listStyle: 'none', p: 0, m: 0 }}
				>
					{tarjetas.map((t) => (
						<Box
							component="li"
							key={t.nombre}
							sx={{
								display: 'flex',
								alignItems: 'baseline',
								gap: 1,
								py: 0.75,
								borderTop: BORDE,
							}}
						>
							<Typography
								variant="body2"
								sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}
							>
								{t.nombre}
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
							>
								{t.valor}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: GRIS, width: 40, textAlign: 'right' }}
							>
								{t.nota}
							</Typography>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}

export interface ReporteMotivosTabProps {
	perfil: PerfilMotivos;
	/** Jefe de zona: sus tiendas (fijas). `null`: elige la zona. */
	tiendasJefe?: number[] | null;
}

/**
 * Reportes → Horas extras → Por motivo: indicadores, horas aprobadas por motivo de
 * solicitud y rechazos por motivo de rechazo; según el perfil, detalle y jefes de zona.
 */
export default function ReporteMotivosTab({
	perfil,
	tiendasJefe = null,
}: ReporteMotivosTabProps) {
	const ver = PERFIL[perfil];
	const { showSnackbar } = useAvisos();
	const tiempo = useSelectorTiempo(ver.modos);
	const [zonaId, setZonaId] = useState(TODAS);
	const [exportando, setExportando] = useState(false);
	const zonas = useZonas(!tiendasJefe).data ?? [];
	const zona = zonas.find((z) => z.id === zonaId);
	const tiendas = tiendasJefe ?? zona?.tiendas ?? [];
	const zonaTexto = tiendasJefe
		? 'Mis tiendas'
		: (zona?.nombre ?? 'Todas las zonas');

	const {
		reporte,
		rechazos,
		jefes,
		motivosSolicitud,
		nombreMotivo,
		nombreJefe,
		isLoading,
		error,
	} = useReporteMotivos({
		tiendas,
		desde: tiempo.desde,
		hasta: tiempo.hasta,
		// Un jefe sin tiendas no consulta: sin filtro vería todo lo que Directus le permita.
		enabled: tiempo.listo && tiendasJefe?.length !== 0,
		porJefe: ver.jefes,
	});
	const nombre = (id: number | null) => nombreMotivo(id) ?? SIN_MOTIVO;
	const vacio =
		reporte.aprobadas.registros +
			reporte.pendientes.registros +
			reporte.rechazadas.registros ===
		0;
	const aprobadasPorMotivo = reporte.motivos.filter(
		(m) => m.aprobadas.minutos > 0,
	);
	const hayHistorico = reporte.motivos.some((m) => m.motivoId == null);
	// Columnas fijas por jefe: el catálogo y, si hay, el histórico.
	const columnasJefe = [
		...motivosSolicitud.map((m) => m.id as number | null),
		null,
	].filter((id) => jefes.some((j) => j.porMotivo.has(id)));

	const exportar = async () => {
		setExportando(true);
		try {
			await exportarReporteMotivosExcel({
				filtro: `${zonaTexto} · ${tiempo.etiqueta}`,
				reporte,
				rechazos: ver.rechazos ? rechazos : null,
				jefes,
				columnasJefe,
				nombreMotivo: nombre,
				nombreJefe,
			});
		} catch (err) {
			showSnackbar(
				mensajeDeError(err, 'Error al exportar el reporte'),
				'error',
			);
		} finally {
			setExportando(false);
		}
	};

	return (
		<Box>
			<Filtros resumen={`${zonaTexto} · ${tiempo.etiqueta}`}>
				{!tiendasJefe && (
					<FormControl
						size="small"
						fullWidth
						sx={{
							minWidth: { sm: 200 },
							width: { sm: 'auto' },
							'& .MuiInputBase-root': { minHeight: TACTIL },
						}}
					>
						<InputLabel id="rm-zona">Zona</InputLabel>
						<Select
							labelId="rm-zona"
							label="Zona"
							value={zonaId}
							onChange={(e) => setZonaId(e.target.value)}
						>
							<MenuItem value={TODAS}>Todas las zonas</MenuItem>
							{zonas.map((z) => (
								<MenuItem key={z.id} value={z.id}>
									{z.nombre}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)}
				<SelectorTiempo selector={tiempo} />
				{ver.excel && (
					<Button
						variant="outlined"
						startIcon={<FileDownloadIcon />}
						disabled={vacio || isLoading || exportando}
						onClick={exportar}
						sx={{ minHeight: TACTIL, ml: { sm: 'auto' } }}
					>
						Exportar Excel
					</Button>
				)}
			</Filtros>

			{(error || tiempo.error) && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{mensajeDeError(
						error ?? tiempo.error,
						'Error al cargar el reporte por motivo',
					)}
				</Alert>
			)}

			{tiempo.cargando || isLoading ? (
				<Cargando />
			) : tiempo.sinPeriodos ? (
				<Alert severity="info">Aún no hay periodos creados.</Alert>
			) : tiendasJefe?.length === 0 ? (
				<Alert severity="info">No tienes tiendas asignadas.</Alert>
			) : vacio ? (
				<Alert severity="info">
					No hay horas extras en {zonaTexto.toLowerCase()} en {tiempo.etiqueta}.
				</Alert>
			) : (
				<>
					<Kpis>
						<Kpi
							principal
							titulo="Horas aprobadas"
							valor={horasCortas(reporte.aprobadas.minutos)}
							nota={tiempo.etiqueta}
						/>
						<Kpi
							titulo="Registros aprobados"
							valor={String(reporte.aprobadas.registros)}
						/>
						{ver.rechazos && (
							<Kpi
								titulo="Registros rechazados"
								valor={String(reporte.rechazadas.registros)}
								nota={horasCortas(reporte.rechazadas.minutos)}
							/>
						)}
						{ver.rechazos && (
							<Kpi
								titulo="% aprobación"
								valor={
									reporte.tasaAprobacion == null
										? '--'
										: pct(reporte.tasaAprobacion)
								}
								nota="Aprobados de los revisados"
							/>
						)}
						{ver.pendientes && (
							<Kpi
								titulo="Pendientes de revisar"
								valor={String(reporte.pendientes.registros)}
								nota={horasCortas(reporte.pendientes.minutos)}
							/>
						)}
					</Kpis>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: {
								xs: '1fr',
								md: ver.rechazos ? 'repeat(2, minmax(0, 1fr))' : '1fr',
							},
							gap: 2,
							mb: 3,
						}}
					>
						<Barras
							titulo="Horas aprobadas por motivo"
							nombres={aprobadasPorMotivo.map((m) => nombre(m.motivoId))}
							valores={aprobadasPorMotivo.map((m) =>
								horasDecimal(m.aprobadas.minutos),
							)}
							unidad={(v) => `${v} h`}
							color={AZUL}
							tarjetas={
								ver.tabla
									? undefined
									: aprobadasPorMotivo.map((m) => ({
											nombre: nombre(m.motivoId),
											valor: horasCortas(m.aprobadas.minutos),
											nota: pct(m.porcentaje),
										}))
							}
						/>
						{ver.rechazos && (
							<Barras
								titulo="Rechazos por motivo"
								nombres={rechazos.map((r) => nombre(r.motivoId))}
								valores={rechazos.map((r) => r.registros)}
								unidad={(v) => `${v} reg.`}
								color={ROJO}
								tarjetas={
									ver.tabla
										? undefined
										: rechazos.map((r) => ({
												nombre: nombre(r.motivoId),
												valor: `${r.registros} ${r.registros === 1 ? 'registro' : 'registros'}`,
												nota: pct(r.porcentaje),
											}))
								}
							/>
						)}
					</Box>

					{ver.tabla && (
						<Bloque titulo="Detalle por motivo">
							<Tabla
								titulo="Detalle por motivo"
								columnas={[
									'Motivo',
									'Horas aprobadas',
									'Registros',
									'% del total',
									...(ver.pendientes ? ['Pendientes'] : []),
									...(ver.rechazos ? ['Rechazadas', '% aprobación'] : []),
								]}
							>
								{reporte.motivos.map((m) => (
									<TableRow key={m.motivoId ?? 'sin'} hover sx={fila}>
										<TableCell
											sx={{
												fontWeight: 600,
												color: m.motivoId == null ? GRIS : 'inherit',
											}}
										>
											{nombre(m.motivoId)}
										</TableCell>
										<TableCell
											align="right"
											sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
										>
											{formatoMinutos(m.aprobadas.minutos)}
										</TableCell>
										<TableCell align="right">{m.aprobadas.registros}</TableCell>
										<TableCell align="right">{pct(m.porcentaje)}</TableCell>
										{ver.pendientes && (
											<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
												{formatoMinutos(m.pendientes.minutos)}
											</TableCell>
										)}
										{ver.rechazos && (
											<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
												{formatoMinutos(m.rechazadas.minutos)}
											</TableCell>
										)}
										{ver.rechazos && (
											<TableCell align="right">
												{m.tasaAprobacion == null
													? '--'
													: pct(m.tasaAprobacion)}
											</TableCell>
										)}
									</TableRow>
								))}
							</Tabla>
						</Bloque>
					)}

					{ver.jefes && jefes.length > 0 && (
						<Bloque titulo="Horas aprobadas por jefe de zona">
							<Tabla
								titulo="Horas aprobadas por jefe de zona"
								columnas={[
									'Jefe de zona',
									...columnasJefe.map(nombre),
									'Total aprobadas',
									...(ver.rechazos ? ['Rechazadas'] : []),
								]}
							>
								{jefes.map((j) => (
									<TableRow key={j.creadaPor ?? 'sin'} hover sx={fila}>
										<TableCell sx={{ fontWeight: 600 }}>
											{nombreJefe(j.creadaPor)}
										</TableCell>
										{columnasJefe.map((id) => (
											<TableCell
												key={id ?? 'sin'}
												align="right"
												sx={{ whiteSpace: 'nowrap' }}
											>
												{formatoMinutos(j.porMotivo.get(id) ?? 0)}
											</TableCell>
										))}
										<TableCell
											align="right"
											sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
										>
											{formatoMinutos(j.aprobadas.minutos)}
										</TableCell>
										{ver.rechazos && (
											<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
												{formatoMinutos(j.rechazadas.minutos)}
											</TableCell>
										)}
									</TableRow>
								))}
							</Tabla>
						</Bloque>
					)}

					{hayHistorico && (
						<Typography
							variant="caption"
							sx={{ display: 'block', color: GRIS }}
						>
							{SIN_MOTIVO}: horas registradas antes de la lista de motivos.
						</Typography>
					)}
				</>
			)}
		</Box>
	);
}
