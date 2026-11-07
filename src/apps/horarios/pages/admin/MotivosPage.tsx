import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Skeleton,
	Switch,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Tooltip,
	Typography,
} from '@mui/material';
import { useState } from 'react';
import { MotivoDialog } from '../../components/admin/MotivoDialog';
import {
	hayCupoMotivo,
	MAX_MOTIVOS_ACTIVOS,
	type Motivo,
	TIPO_MOTIVO,
	type TipoMotivo,
} from '../../domain/horasExtras';
import { useAdminMotivos } from '../../hooks/useAdminMotivos';
import { useAvisos } from '../../hooks/useAvisos';
import { mensajeDeError } from '../../utils/errores';

const GRIS = '#64748b';
const head = { fontWeight: 700, color: '#1e293b', bgcolor: '#f0f7ff' };
const LISTAS = [
	{ tipo: TIPO_MOTIVO.solicitud, label: 'Solicitud', nombre: 'solicitud' },
	{ tipo: TIPO_MOTIVO.rechazo, label: 'Rechazo', nombre: 'rechazo' },
] as const;

function ListaMotivos({ tipo, nombre }: { tipo: TipoMotivo; nombre: string }) {
	const { showSnackbar } = useAvisos();
	const { motivos, usos, isLoading, error, crear, editar, borrar } =
		useAdminMotivos(tipo);
	// `null` = cerrado; `'nuevo'` = crear.
	const [editando, setEditando] = useState<Motivo | 'nuevo' | null>(null);
	const [borrando, setBorrando] = useState<Motivo | null>(null);
	const hayCupo = hayCupoMotivo(motivos);
	const fallo = (err: unknown) =>
		showSnackbar(mensajeDeError(err, 'No se pudo guardar el motivo'), 'error');

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 1.5,
					mb: 2,
				}}
			>
				<Typography variant="body2" sx={{ color: GRIS, maxWidth: 560 }}>
					{hayCupo
						? 'Las opciones nuevas aparecen antes de "Otros".'
						: `Ya hay ${MAX_MOTIVOS_ACTIVOS} motivos activos. Desactiva uno para agregar otro.`}
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					disabled={!hayCupo || isLoading}
					onClick={() => setEditando('nuevo')}
				>
					Agregar motivo
				</Button>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{mensajeDeError(error, 'Error al cargar los motivos')}
				</Alert>
			)}

			{isLoading ? (
				<Skeleton variant="rounded" height={240} />
			) : (
				<TableContainer
					sx={{ borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#fff' }}
				>
					<Table size="small" aria-label={`Motivos de ${nombre}`}>
						<TableHead>
							<TableRow>
								<TableCell sx={head}>Motivo</TableCell>
								<TableCell sx={head}>Estado</TableCell>
								<TableCell sx={head} align="right">
									Acciones
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{motivos.map((m) => {
								const n = usos(m.id);
								return (
									<TableRow key={m.id} hover>
										<TableCell sx={{ py: 1.25 }}>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 0.75,
												}}
											>
												{m.sistema && (
													<LockOutlinedIcon
														fontSize="small"
														sx={{ color: GRIS }}
														titleAccess="Motivo del sistema, no se puede modificar"
													/>
												)}
												<Typography
													variant="body2"
													sx={{
														fontWeight: 600,
														color: m.activo ? 'inherit' : GRIS,
													}}
												>
													{m.nombre}
												</Typography>
											</Box>
											{(m.descripcion || m.pideTexto) && (
												<Typography
													variant="caption"
													component="div"
													sx={{ color: GRIS }}
												>
													{[m.descripcion, m.pideTexto ? 'Pide texto' : '']
														.filter(Boolean)
														.join(' · ')}
												</Typography>
											)}
											{n !== undefined && n > 0 && (
												<Typography
													variant="caption"
													component="div"
													sx={{ color: GRIS }}
												>
													Usado en {n} {n === 1 ? 'hora extra' : 'horas extras'}
												</Typography>
											)}
										</TableCell>
										<TableCell>
											{m.sistema ? (
												<Chip size="small" label="Sistema" />
											) : (
												<Box sx={{ display: 'flex', alignItems: 'center' }}>
													<Switch
														size="small"
														checked={m.activo}
														disabled={
															editar.isPending || (!m.activo && !hayCupo)
														}
														onChange={(_, activo) =>
															editar.mutate(
																{ id: m.id, activo },
																{ onError: fallo },
															)
														}
														slotProps={{
															input: { 'aria-label': `Activo: ${m.nombre}` },
														}}
													/>
													<Typography variant="body2">
														{m.activo ? 'Activo' : 'Inactivo'}
													</Typography>
												</Box>
											)}
										</TableCell>
										<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
											{!m.sistema && (
												<>
													<Tooltip title="Editar">
														<IconButton
															aria-label={`Editar ${m.nombre}`}
															onClick={() => setEditando(m)}
														>
															<EditOutlinedIcon fontSize="small" />
														</IconButton>
													</Tooltip>
													{n === 0 && (
														<Tooltip title="Borrar">
															<IconButton
																aria-label={`Borrar ${m.nombre}`}
																onClick={() => setBorrando(m)}
															>
																<DeleteOutlineIcon fontSize="small" />
															</IconButton>
														</Tooltip>
													)}
												</>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{editando && (
				<MotivoDialog
					lista={nombre}
					motivo={editando === 'nuevo' ? null : editando}
					delTipo={motivos}
					guardando={crear.isPending || editar.isPending}
					onClose={() => setEditando(null)}
					onGuardar={(datos) => {
						const listo = {
							onSuccess: () => {
								setEditando(null);
								showSnackbar('Motivo guardado', 'success');
							},
							onError: fallo,
						};
						if (editando === 'nuevo') crear.mutate(datos, listo);
						else editar.mutate({ id: editando.id, ...datos }, listo);
					}}
				/>
			)}

			<Dialog
				open={borrando != null}
				onClose={() => setBorrando(null)}
				aria-labelledby="borrar-motivo-titulo"
			>
				<DialogTitle id="borrar-motivo-titulo">Borrar motivo</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Borrar "{borrando?.nombre}"? No se ha usado en ninguna hora extra.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setBorrando(null)}>Cancelar</Button>
					<Button
						color="error"
						variant="contained"
						disabled={borrar.isPending}
						onClick={() =>
							borrando &&
							borrar.mutate(borrando.id, {
								onSuccess: () => {
									setBorrando(null);
									showSnackbar('Motivo borrado', 'success');
								},
								onError: fallo,
							})
						}
					>
						Borrar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

/**
 * Admin → Motivos de horas extras: listas de solicitud y de rechazo. Los motivos
 * del sistema no se modifican; las opciones nuevas se crean, editan, activan y,
 * si nunca se usaron, se borran.
 */
export default function MotivosPage() {
	const [lista, setLista] = useState<(typeof LISTAS)[number]['tipo']>(
		TIPO_MOTIVO.solicitud,
	);
	const actual = LISTAS.find((l) => l.tipo === lista) ?? LISTAS[0];
	return (
		<Paper
			elevation={0}
			sx={{
				p: { xs: 1.5, sm: 3 },
				borderRadius: 3,
				border: '1px solid #e0e0e0',
			}}
		>
			<Typography variant="h6" sx={{ fontWeight: 700, color: '#004680' }}>
				Motivos de horas extras
			</Typography>
			<Typography variant="body2" sx={{ color: GRIS, mb: 2 }}>
				Solicitud: los elige el jefe de zona al registrar. Rechazo: los elige
				Dirección Comercial al rechazar. Los motivos del sistema no se pueden
				modificar.
			</Typography>
			<Tabs
				value={lista}
				onChange={(_, v: TipoMotivo) => setLista(v as typeof lista)}
				aria-label="Lista de motivos"
				sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
			>
				{LISTAS.map((l) => (
					<Tab key={l.tipo} value={l.tipo} label={l.label} />
				))}
			</Tabs>
			<ListaMotivos
				key={actual.tipo}
				tipo={actual.tipo}
				nombre={actual.nombre}
			/>
		</Paper>
	);
}
