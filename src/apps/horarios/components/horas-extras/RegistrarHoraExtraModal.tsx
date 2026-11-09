import {
	Alert,
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { useAuth } from '@/auth/hooks/useAuth';
import { crearHorasExtras } from '../../api/directus/horasExtras';
import {
	buscarDuplicado,
	type ErroresHoraExtra,
	type ErroresMotivo,
	formatoMinutos,
	TIPO_MOTIVO,
	textoBloque,
	textoDelMotivo,
	validarHoraExtra,
	validarMotivo,
} from '../../domain/horasExtras';
import type { EmpleadoAsistencia } from '../../domain/registro';
import { MAX_CARACTERES_OBSERVACION } from '../../domain/registro';
import { horariosKeys } from '../../hooks/registro/keys';
import { useAvisos } from '../../hooks/useAvisos';
import { useBloqueHorasExtras } from '../../hooks/useBloqueHorasExtras';
import { useHorasExtras } from '../../hooks/useHorasExtras';
import { useMotivos } from '../../hooks/useMotivos';
import type { CreateOverTimeDto } from '../../interfaces/api/overTime';
import type { Tienda } from '../../interfaces/tiendas';
import { mensajeDeError } from '../../utils/errores';
import { formatNombrePropio } from '../../utils/format';
import { getRealColombiaTime } from '../../utils/timeSync';
import { AvisoHorasExistentesDialog } from './AvisoHorasExistentesDialog';

export interface RegistrarHoraExtraModalProps {
	open: boolean;
	empleados: EmpleadoAsistencia[];
	cargandoEmpleados?: boolean;
	tiendas: Tienda[];
	tiendasLider: number[];
	onClose: () => void;
}

const etiquetaEmpleado = (e: EmpleadoAsistencia) =>
	`${formatNombrePropio(e.nombre)} · ${e.documento}`;

function Dato({
	titulo,
	destacado = false,
	children,
}: {
	titulo: string;
	destacado?: boolean;
	children: ReactNode;
}) {
	return (
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="body2" sx={{ color: '#64748b' }}>
				{titulo}
			</Typography>
			<Typography
				sx={{
					fontWeight: destacado ? 700 : 600,
					fontSize: destacado ? '1.1rem' : '0.95rem',
					color: destacado ? '#004680' : '#1e293b',
				}}
			>
				{children}
			</Typography>
		</Box>
	);
}

/**
 * Registro **individual**: una persona y un día. Busca entre todos los empleados
 * del líder; la tienda es la del empleado y puede cambiarse (rotación). Avisa si
 * ya tiene una hora extra activa ese día (no bloquea). Para varias personas o
 * días está la sub‑página masiva.
 */
export function RegistrarHoraExtraModal({
	open,
	empleados,
	cargandoEmpleados = false,
	tiendas,
	tiendasLider,
	onClose,
}: RegistrarHoraExtraModalProps) {
	const queryClient = useQueryClient();
	const { showSnackbar } = useAvisos();
	const { user } = useAuth();
	const hoy = getRealColombiaTime().format('YYYY-MM-DD');
	const [empleado, setEmpleado] = useState<EmpleadoAsistencia | null>(null);
	const tiendaEmpleado = empleado?.storeId ?? null;

	const [tiendaId, setTiendaId] = useState<number | ''>('');
	const [fecha, setFecha] = useState(hoy);
	const [horas, setHoras] = useState('');
	const [motivoId, setMotivoId] = useState<number | ''>('');
	const [observacion, setObservacion] = useState('');
	const [avisando, setAvisando] = useState(false);
	const [errores, setErrores] = useState<
		ErroresHoraExtra & ErroresMotivo & { tienda?: string }
	>({});
	const motivos = useMotivos(TIPO_MOTIVO.solicitud, open);
	const {
		bloque,
		cargando: cargandoBloque,
		aviso,
	} = useBloqueHorasExtras(open);
	const motivo = motivoId === '' ? undefined : motivos.porId.get(motivoId);

	const empleadoId = Number(empleado?.id);
	const { data: delDia = [] } = useHorasExtras(
		{
			tiendas: tiendaEmpleado != null ? [tiendaEmpleado] : [],
			empleadoId,
			desde: fecha,
			hasta: fecha,
			incluirPruebas: true,
		},
		open && empleado != null && /^\d{4}-\d{2}-\d{2}$/.test(fecha),
	);
	const duplicado = buscarDuplicado(delDia);

	const guardar = useMutation({
		mutationFn: (dto: CreateOverTimeDto) => crearHorasExtras([dto]),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: horariosKeys.horasExtras.todos,
			});
			showSnackbar(
				'Hora extra registrada: queda pendiente de aprobación',
				'success',
			);
			onClose();
		},
		onError: (err) =>
			showSnackbar(
				mensajeDeError(err, 'Error al registrar la hora extra'),
				'error',
			),
	});

	const minutos = Math.round(Number(horas) * 60);

	const enviar = () => {
		if (!empleado) {
			setErrores({ empleado: 'Busca y elige un empleado' });
			return;
		}
		const e: ErroresHoraExtra & ErroresMotivo & { tienda?: string } = {
			...validarHoraExtra(
				{ workDate: fecha, minutos },
				{
					hoy,
					empleadoActivo: true, // la lista solo trae empleados activos
					empleadoDelLider:
						tiendaEmpleado != null && tiendasLider.includes(tiendaEmpleado),
					bloque,
				},
			),
			...validarMotivo(motivo, observacion),
		};
		if (tiendaId === '') e.tienda = 'La tienda es obligatoria';
		setErrores(e);
		if (Object.keys(e).length > 0 || tiendaId === '') return;
		// Ya tiene una hora extra activa ese día: primero el paso de advertencia.
		if (duplicado) setAvisando(true);
		else registrar();
	};
	const registrar = () => {
		setAvisando(false);
		guardar.mutate({
			employee_id: empleadoId,
			store_id: Number(tiendaId),
			work_date: fecha,
			minutes: minutos,
			reason_id: Number(motivoId),
			observations: textoDelMotivo(motivo, observacion),
			created_by: user?.id ?? '',
		});
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={guardar.isPending ? undefined : onClose}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle sx={{ fontWeight: 700, color: '#004680' }}>
					Registrar hora extra individual
					<Typography variant="body2" sx={{ color: '#64748b' }}>
						Queda pendiente de aprobación del comercial
					</Typography>
				</DialogTitle>
				<DialogContent dividers>
					<Box
						sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
					>
						{aviso && <Alert severity="warning">{aviso}</Alert>}
						<Autocomplete
							options={empleados}
							value={empleado}
							loading={cargandoEmpleados}
							onChange={(_, e) => {
								setEmpleado(e);
								setTiendaId(e?.storeId ?? '');
								setErrores({});
							}}
							getOptionLabel={etiquetaEmpleado}
							isOptionEqualToValue={(a, b) => a.id === b.id}
							renderOption={({ key, ...props }, e) => (
								<li key={key} {...props}>
									<Box>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>
											{etiquetaEmpleado(e)}
										</Typography>
										<Typography variant="body2" sx={{ color: '#334155' }}>
											Cargo: {e.cargo || 'Sin cargo'}
										</Typography>
									</Box>
								</li>
							)}
							noOptionsText="No hay empleados con ese nombre o documento"
							loadingText="Cargando empleados..."
							renderInput={(params) => (
								<TextField
									{...params}
									label="Empleado"
									placeholder="Buscar por nombre o documento"
									error={!!errores.empleado}
									helperText={errores.empleado}
									autoFocus
								/>
							)}
						/>
						{/* El cargo define el valor de la hora extra: se muestra destacado, no como ayuda. */}
						{empleado && (
							<Box
								role="group"
								aria-label="Persona elegida"
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr 1fr' },
									gap: 1.5,
									p: 1.5,
									borderRadius: 2,
									border: '1px solid #bfdbfe',
									bgcolor: '#eff6ff',
								}}
							>
								<Dato titulo="Cargo" destacado>
									{empleado.cargo || 'Sin cargo'}
								</Dato>
								<Dato titulo="Documento">{empleado.documento}</Dato>
								<Dato titulo="Su tienda">
									{tiendas.find((t) => Number(t.id) === tiendaEmpleado)?.name ??
										'--'}
								</Dato>
							</Box>
						)}

						<FormControl fullWidth error={!!errores.tienda}>
							<InputLabel id="he-tienda">Tienda donde trabajó</InputLabel>
							<Select
								labelId="he-tienda"
								label="Tienda donde trabajó"
								value={tiendaId}
								onChange={(e) => setTiendaId(Number(e.target.value))}
							>
								{tiendas.map((t) => (
									<MenuItem key={t.id} value={Number(t.id)}>
										{t.name}
										{Number(t.id) === tiendaEmpleado ? ' (su tienda)' : ''}
									</MenuItem>
								))}
							</Select>
							<FormHelperText>
								{errores.tienda ??
									(tiendaId !== '' && tiendaId !== tiendaEmpleado
										? 'Rotación: trabajó en una tienda distinta a la suya'
										: 'Por defecto, la tienda del empleado')}
							</FormHelperText>
						</FormControl>

						<TextField
							label="Fecha"
							type="date"
							value={fecha}
							onChange={(e) => setFecha(e.target.value)}
							slotProps={{
								inputLabel: { shrink: true },
								htmlInput: { max: hoy },
							}}
							error={!!errores.workDate}
							helperText={errores.workDate}
							fullWidth
						/>

						<TextField
							label="Horas extras"
							type="number"
							value={horas}
							onChange={(e) => setHoras(e.target.value)}
							slotProps={{
								htmlInput: { min: bloque / 60, step: bloque / 60 },
							}}
							error={!!errores.minutos}
							helperText={
								errores.minutos ??
								(minutos > 0
									? formatoMinutos(minutos)
									: `En bloques de ${textoBloque(bloque)}`)
							}
							fullWidth
						/>

						<FormControl fullWidth required error={!!errores.motivo}>
							<InputLabel id="he-motivo">Motivo</InputLabel>
							<Select
								labelId="he-motivo"
								label="Motivo"
								value={motivoId}
								onChange={(e) => {
									setMotivoId(Number(e.target.value) || '');
									setErrores(({ motivo: _, texto: __, ...resto }) => resto);
								}}
							>
								{motivos.opciones.map((m) => (
									<MenuItem key={m.id} value={m.id}>
										{m.nombre}
									</MenuItem>
								))}
							</Select>
							<FormHelperText>
								{errores.motivo ??
									(motivos.error
										? 'No se pudieron cargar los motivos'
										: motivo?.descripcion || 'Por qué se generó la hora extra')}
							</FormHelperText>
						</FormControl>

						{/* Solo el motivo que lo pide ("Otros") lleva texto. */}
						{motivo?.pideTexto && (
							<TextField
								label="Escribe el motivo"
								required
								value={observacion}
								onChange={(e) => setObservacion(e.target.value)}
								multiline
								minRows={2}
								error={!!errores.texto}
								helperText={
									errores.texto ??
									`${observacion.length}/${MAX_CARACTERES_OBSERVACION}`
								}
								slotProps={{
									htmlInput: { maxLength: MAX_CARACTERES_OBSERVACION },
								}}
								fullWidth
							/>
						)}
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={onClose} disabled={guardar.isPending}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={enviar}
						disabled={guardar.isPending || cargandoBloque}
						startIcon={
							guardar.isPending ? <CircularProgress size={16} /> : undefined
						}
					>
						Registrar
					</Button>
				</DialogActions>
			</Dialog>
			<AvisoHorasExistentesDialog
				open={avisando && duplicado != null}
				coincidencias={
					duplicado && empleado
						? [
								{
									clave: `${empleado.id}|${fecha}`,
									empleado: formatNombrePropio(empleado.nombre),
									cargo: empleado.cargo,
									fecha,
									yaMinutos: duplicado.minutes,
									estado: duplicado.status,
									nuevosMinutos: minutos,
								},
							]
						: []
				}
				onVolver={() => setAvisando(false)}
				onContinuar={registrar}
			/>
		</>
	);
}
