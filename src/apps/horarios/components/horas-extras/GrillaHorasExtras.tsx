import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
	Box,
	Checkbox,
	IconButton,
	InputBase,
	NativeSelect,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { memo } from 'react';
import {
	claveDia,
	type ErrorLinea,
	type Motivo,
} from '../../domain/horasExtras';
import { MAX_CARACTERES_OBSERVACION } from '../../domain/registro';

export interface PersonaGrilla {
	id: string;
	nombre: string;
	documento: string;
	cargo?: string;
}

interface Acciones {
	onCelda: (clave: string, minutos: number) => void;
	onSeleccion: (ids: string[], marcar: boolean) => void;
	onObservacion: (id: string, texto: string) => void;
	onMotivo: (id: string, motivo: number) => void;
	onTienda: (id: string, tienda: number) => void;
	onRellenarFila: (id: string) => void;
}

export interface GrillaHorasExtrasProps extends Acciones {
	personas: PersonaGrilla[];
	dias: string[];
	/** `claveDia` → minutos. */
	celdas: ReadonlyMap<string, number>;
	/** `claveDia` → texto de la hora extra ya registrada (aviso). */
	existentes: ReadonlyMap<string, string>;
	errores: ReadonlyMap<string, ErrorLinea>;
	seleccion: ReadonlySet<string>;
	/** Texto del motivo "Otros" por persona. */
	observaciones: ReadonlyMap<string, string>;
	/** Motivos de solicitud para elegir. */
	motivos: Motivo[];
	motivoDe: ReadonlyMap<string, number>;
	/** Persona → falta el motivo o su texto. */
	erroresMotivo: ReadonlyMap<string, string>;
	/** Tienda donde trabajó cada persona (por defecto, la suya). */
	tiendaDe: ReadonlyMap<string, number>;
	tiendas: { id: number; name: string }[];
	/** Texto del valor rápido, para los tooltips de rellenar. */
	valorTexto: string;
	/** Minutos del bloque configurado (paso de cada celda). */
	bloque: number;
	onRellenarColumna: (dia: string) => void;
}

const head = { fontWeight: 700, color: '#1e293b', bgcolor: '#f0f7ff', py: 1 };
const sticky = {
	position: 'sticky',
	left: 0,
	zIndex: 2,
	bgcolor: 'background.paper',
	borderRight: '1px solid #e2e8f0',
} as const;
const caja = {
	border: '1px solid #cbd5e1',
	borderRadius: 1,
	px: 1,
	fontSize: '0.875rem',
	'&.Mui-focused': { borderColor: '#004680', boxShadow: '0 0 0 1px #004680' },
} as const;

/** Lo que una fila necesita, en valores simples para que `memo` la salte si no cambió. */
interface FilaProps extends Acciones {
	p: PersonaGrilla;
	dias: string[];
	/** Por día: minutos, error y aviso de esta persona. */
	minutos: (number | undefined)[];
	errores: (string | undefined)[];
	avisos: (string | undefined)[];
	marcada: boolean;
	observacion: string;
	motivoId: number | undefined;
	pideTexto: boolean;
	errorMotivo: string | undefined;
	motivos: Motivo[];
	tienda: number | undefined;
	tiendas: { id: number; name: string }[];
	valorTexto: string;
	bloque: number;
}

const mismosArrays = (a: unknown[], b: unknown[]) =>
	a.length === b.length && a.every((v, i) => v === b[i]);

/** Igualdad superficial, comparando por contenido los arrays por día (se recrean en cada render). */
function filaIgual(a: FilaProps, b: FilaProps) {
	return (Object.keys(a) as (keyof FilaProps)[]).every((k) =>
		Array.isArray(a[k]) && k !== 'dias' && k !== 'tiendas' && k !== 'motivos'
			? mismosArrays(a[k] as unknown[], b[k] as unknown[])
			: a[k] === b[k],
	);
}

const FilaPersona = memo(function FilaPersona({
	p,
	dias,
	minutos,
	errores,
	avisos,
	marcada,
	observacion,
	motivoId,
	pideTexto,
	errorMotivo,
	motivos,
	tienda,
	tiendas,
	valorTexto,
	bloque,
	onCelda,
	onSeleccion,
	onObservacion,
	onMotivo,
	onTienda,
	onRellenarFila,
}: FilaProps) {
	return (
		<TableRow hover selected={marcada}>
			<TableCell sx={sticky}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Checkbox
						size="small"
						checked={marcada}
						onChange={(e) => onSeleccion([p.id], e.target.checked)}
						slotProps={{ input: { 'aria-label': `Seleccionar ${p.nombre}` } }}
					/>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
							{p.nombre}
						</Typography>
						<Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
							{p.documento}
						</Typography>
					</Box>
					<IconButton
						size="small"
						title={`Poner ${valorTexto} en todos los días`}
						aria-label={`Rellenar fila de ${p.nombre}`}
						onClick={() => onRellenarFila(p.id)}
					>
						<FormatColorFillIcon fontSize="inherit" />
					</IconButton>
				</Box>
			</TableCell>
			{/* El cargo define el valor de la hora extra: columna propia, no subtítulo. */}
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
					{p.cargo || 'Sin cargo'}
				</Typography>
			</TableCell>
			<TableCell>
				{/* Nativo: mucho más liviano que el Select de MUI repetido en cada fila. */}
				<NativeSelect
					value={tienda ?? ''}
					onChange={(e) => onTienda(p.id, Number(e.target.value))}
					inputProps={{ 'aria-label': `Tienda donde trabajó ${p.nombre}` }}
					sx={{ minWidth: 140, fontSize: '0.8rem' }}
				>
					{tiendas.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</NativeSelect>
			</TableCell>
			{dias.map((d, i) => {
				const valor = minutos[i];
				const error = errores[i];
				const aviso = avisos[i];
				const input = (
					<InputBase
						type="number"
						value={valor ? valor / 60 : ''}
						placeholder="–"
						onChange={(e) =>
							onCelda(
								claveDia(p.id, d),
								e.target.value === ''
									? 0
									: Math.round(Number(e.target.value) * 60),
							)
						}
						error={!!error}
						inputProps={{
							min: 0,
							step: bloque / 60,
							'aria-label': `Horas de ${p.nombre} el ${dayjs(d).format('DD/MM')}`,
							'aria-invalid': !!error,
							style: { textAlign: 'center' },
						}}
						sx={{
							...caja,
							width: 84,
							bgcolor: valor ? '#eff6ff' : undefined,
							borderColor: error ? '#d32f2f' : '#cbd5e1',
						}}
					/>
				);
				return (
					<TableCell key={d} align="center" sx={{ px: 0.5 }}>
						<Box
							sx={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 0.25,
							}}
						>
							{/* Tooltip solo cuando hay algo que decir: cada uno registra listeners. */}
							{error ? <Tooltip title={error}>{input}</Tooltip> : input}
							{/* Marca discreta: el aviso fuerte es el paso de advertencia al registrar. */}
							{aviso && (
								<Tooltip title={aviso}>
									<InfoOutlinedIcon
										titleAccess={aviso}
										tabIndex={0}
										sx={{ fontSize: 16, color: '#64748b' }}
									/>
								</Tooltip>
							)}
						</Box>
					</TableCell>
				);
			})}
			<TableCell>
				{/* Nativo, como la tienda: liviano aunque se repita en cada fila. */}
				<NativeSelect
					value={motivoId ?? ''}
					onChange={(e) => onMotivo(p.id, Number(e.target.value))}
					inputProps={{
						'aria-label': `Motivo de ${p.nombre}`,
						'aria-invalid': !!errorMotivo,
					}}
					error={!!errorMotivo}
					sx={{ minWidth: 200, fontSize: '0.8rem' }}
				>
					<option value="">Elige un motivo</option>
					{motivos.map((m) => (
						<option key={m.id} value={m.id}>
							{m.nombre}
						</option>
					))}
				</NativeSelect>
				{pideTexto && (
					<InputBase
						placeholder="Escribe el motivo"
						value={observacion}
						onChange={(e) => onObservacion(p.id, e.target.value)}
						inputProps={{
							maxLength: MAX_CARACTERES_OBSERVACION,
							'aria-label': `Texto del motivo de ${p.nombre}`,
						}}
						sx={{ ...caja, width: '100%', py: 0.25, mt: 0.5 }}
					/>
				)}
				{errorMotivo && (
					<Typography
						variant="caption"
						role="alert"
						sx={{ display: 'block', color: '#d32f2f' }}
					>
						{errorMotivo}
					</Typography>
				)}
			</TableCell>
		</TableRow>
	);
}, filaIgual);

/** Personas en filas, días en columnas y las horas en la intersección. */
export function GrillaHorasExtras({
	personas,
	dias,
	celdas,
	existentes,
	errores,
	seleccion,
	observaciones,
	motivos,
	motivoDe,
	erroresMotivo,
	tiendaDe,
	tiendas,
	valorTexto,
	bloque,
	onRellenarColumna,
	...acciones
}: GrillaHorasExtrasProps) {
	const marcadas = personas.filter((p) => seleccion.has(p.id)).length;
	return (
		<TableContainer
			sx={{
				maxHeight: '60vh',
				overflow: 'auto',
				borderRadius: 2,
				border: '1px solid #e2e8f0',
			}}
		>
			<Table stickyHeader size="small" aria-label="Grilla de horas extras">
				<TableHead>
					<TableRow>
						<TableCell sx={{ ...head, ...sticky, zIndex: 3, minWidth: 240 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Checkbox
									size="small"
									checked={personas.length > 0 && marcadas === personas.length}
									indeterminate={marcadas > 0 && marcadas < personas.length}
									disabled={personas.length === 0}
									onChange={(e) =>
										acciones.onSeleccion(
											personas.map((p) => p.id),
											e.target.checked,
										)
									}
									slotProps={{
										input: { 'aria-label': 'Seleccionar todas las personas' },
									}}
								/>
								Persona
							</Box>
						</TableCell>
						<TableCell sx={{ ...head, minWidth: 140 }}>Cargo</TableCell>
						<TableCell sx={{ ...head, minWidth: 150 }}>Tienda</TableCell>
						{dias.map((d) => (
							<TableCell key={d} align="center" sx={{ ...head, minWidth: 104 }}>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Box sx={{ textTransform: 'capitalize' }}>
										{dayjs(d).format('ddd DD/MM')}
									</Box>
									<Tooltip
										title={`Poner ${valorTexto} en este día a ${marcadas > 0 ? 'las personas seleccionadas' : 'todas las personas'}`}
									>
										<IconButton
											size="small"
											aria-label={`Rellenar columna ${dayjs(d).format('DD/MM')}`}
											onClick={() => onRellenarColumna(d)}
										>
											<FormatColorFillIcon fontSize="inherit" />
										</IconButton>
									</Tooltip>
								</Box>
							</TableCell>
						))}
						<TableCell sx={{ ...head, minWidth: 240 }}>Motivo</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{personas.map((p) => {
						const claves = dias.map((d) => claveDia(p.id, d));
						return (
							<FilaPersona
								key={p.id}
								p={p}
								dias={dias}
								minutos={claves.map((k) => celdas.get(k))}
								errores={claves.map((k) => errores.get(k)?.mensaje)}
								avisos={claves.map((k) => existentes.get(k))}
								marcada={seleccion.has(p.id)}
								observacion={observaciones.get(p.id) ?? ''}
								motivoId={motivoDe.get(p.id)}
								pideTexto={
									motivos.find((m) => m.id === motivoDe.get(p.id))?.pideTexto ??
									false
								}
								errorMotivo={erroresMotivo.get(p.id)}
								motivos={motivos}
								tienda={tiendaDe.get(p.id)}
								tiendas={tiendas}
								valorTexto={valorTexto}
								bloque={bloque}
								{...acciones}
							/>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
