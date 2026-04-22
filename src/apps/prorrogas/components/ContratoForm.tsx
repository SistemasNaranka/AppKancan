import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Divider,
  Typography,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { CreateContrato, Contrato, RequestStatus } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Áreas predefinidas — edita esta lista según tu empresa
// ─────────────────────────────────────────────────────────────────────────────
const AREAS_PREDEFINIDAS = [
  'Contabilidad',
  'Recursos Humanos',
  'Logística',
  'Diseño',
  'Sistemas',
  'Mercadeo',
  'Comercial',
  'Administrativa',
];

const NUEVA_AREA_VALUE = '__nueva__';

// ─────────────────────────────────────────────────────────────────────────────
// Opciones estáticas
// ─────────────────────────────────────────────────────────────────────────────
const tipoContratoOptions = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'definido',   label: 'Definido' },
  { value: 'obra',       label: 'Obra o Labor' },
  { value: 'aprendizaje', label: 'Aprendizaje' },
];

const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: 'pendiente',   label: 'Pendiente' },
  { value: 'en_revision', label: 'En Revisión' },
  { value: 'aprobada',    label: 'Aprobada' },
  { value: 'rechazada',   label: 'Rechazada' },
  { value: 'completada',  label: 'Completada' },
];

const cargoOptions = [
  { value: 1, label: 'Gerente' },
  { value: 2, label: 'Asesor' },
  { value: 3, label: 'Cajero' },
  { value: 4, label: 'Logístico' },
  { value: 5, label: 'Coadministrador' },
  { value: 6, label: 'Gerente Online' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface FormData {
  documento_identidad: string;
  nombre: string;
  apellido: string;
  cargo: number | '';
  tipo_contrato: string;
  area: string;
  fecha_ingreso: string;
  fecha_fin: string;
  duracion_meses: number;
  request_status: RequestStatus;
}

const initialFormData: FormData = {
  documento_identidad: '',
  nombre: '',
  apellido: '',
  cargo: '',
  tipo_contrato: '',
  area: '',
  fecha_ingreso: '',
  fecha_fin: '',
  duracion_meses: 0,
  request_status: 'pendiente',
};

interface ContratoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContrato) => Promise<void>;
  /** Si se pasa, el formulario entra en modo edición */
  initialData?: Contrato;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const ContratoForm: React.FC<ContratoFormProps> = ({
  open, onClose, onSubmit, initialData,
}) => {
  const isEditing = !!initialData;

  const [formData, setFormData]   = useState<FormData>(initialFormData);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  // Estado para áreas personalizadas agregadas en esta sesión
  const [areasExtra, setAreasExtra] = useState<string[]>([]);
  // Controla si se muestra el input para agregar nueva área
  const [showNuevaArea, setShowNuevaArea] = useState(false);
  const [nuevaAreaInput, setNuevaAreaInput] = useState('');

  const todasLasAreas = [...AREAS_PREDEFINIDAS, ...areasExtra];

  // Poblar el form cuando se abre en modo edición
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        documento_identidad: initialData.documento ?? '',
        nombre: initialData.nombre ?? '',
        apellido: initialData.apellido ?? '',
        cargo: typeof initialData.cargo === 'number' ? initialData.cargo : '',
        tipo_contrato: initialData.tipo_contrato ?? '',
        area: initialData.area ?? '',
        fecha_ingreso: initialData.fecha_ingreso ?? '',
        fecha_fin: initialData.fecha_final ?? '',
        duracion_meses: 0,
        request_status: initialData.request_status,
      });
      // Si el área no está en la lista predefinida, agregarla
      if (
        initialData.area &&
        !AREAS_PREDEFINIDAS.includes(initialData.area)
      ) {
        setAreasExtra((prev) =>
          prev.includes(initialData.area!) ? prev : [...prev, initialData.area!],
        );
      }
    } else if (open && !initialData) {
      setFormData(initialFormData);
    }
    setErrors({});
    setShowNuevaArea(false);
    setNuevaAreaInput('');
  }, [open, initialData]);

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      const value = e.target.value;

      // Si elige "Agregar nueva área" en el select
      if (field === 'area' && value === NUEVA_AREA_VALUE) {
        setShowNuevaArea(true);
        return;
      }

      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    };

  const handleAgregarArea = () => {
    const trimmed = nuevaAreaInput.trim();
    if (!trimmed) return;
    if (!todasLasAreas.includes(trimmed)) {
      setAreasExtra((prev) => [...prev, trimmed]);
    }
    setFormData((prev) => ({ ...prev, area: trimmed }));
    setShowNuevaArea(false);
    setNuevaAreaInput('');
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.nombre.trim())    e.nombre    = 'El nombre es requerido';
    if (!formData.apellido.trim())  e.apellido  = 'El apellido es requerido';
    if (!formData.cargo)      e.cargo     = 'El cargo es requerido';
    if (!formData.tipo_contrato)    e.tipo_contrato = 'El tipo de contrato es requerido';
    if (!formData.area.trim())      e.area      = 'El área es requerida';
    if (!formData.fecha_ingreso)    e.fecha_ingreso = 'La fecha de inicio es requerida';
    if (!formData.fecha_fin)        e.fecha_fin = 'La fecha de finalización es requerida';
    if (formData.fecha_ingreso && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) <= new Date(formData.fecha_ingreso)) {
        e.fecha_fin = 'La fecha de fin debe ser posterior al inicio';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const contratoData: CreateContrato = {
        nombre:          formData.nombre,
        apellido:        formData.apellido,
        documento:       formData.documento_identidad,
        cargo: Number(formData.cargo),
        tipo_contrato:   formData.tipo_contrato,
        area:            formData.area,
        fecha_ingreso:   formData.fecha_ingreso,
        fecha_final:     formData.fecha_fin,
        request_status:  formData.request_status,
        ...(isEditing
          ? {}
          : { numero_contrato: `CTR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}` }),
      };
      await onSubmit(contratoData);
      setFormData(initialFormData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) { setFormData(initialFormData); setErrors({}); onClose(); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, padding: 1, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditing
            ? <EditOutlinedIcon sx={{ color: 'primary.main' }} />
            : <BadgeOutlinedIcon sx={{ color: 'primary.main' }} />}
          <Box sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
            {isEditing ? `Editar Contrato — ${initialData?.nombre}` : 'Nuevo Contrato'}
          </Box>
          {isEditing && (
            <Chip label="Modo edición" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '0.7rem', ml: 1 }} />
          )}
        </Box>
        <Button onClick={handleClose} disabled={saving} sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>

          {/* ── Documento ── */}
          {!isEditing && (
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
              <SectionHeader Icon={BadgeOutlinedIcon} label="DOCUMENTO DE IDENTIDAD" />
              <TextField
                label="Número de documento"
                value={formData.documento_identidad}
                onChange={handleChange('documento_identidad')}
                fullWidth size="small" disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}

          {/* ── Datos personales ── */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            <SectionHeader Icon={PersonOutlinedIcon} label="DATOS PERSONALES" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nombre" value={formData.nombre}
                onChange={handleChange('nombre')}
                error={!!errors.nombre} helperText={errors.nombre}
                fullWidth required disabled={saving} size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Apellido" value={formData.apellido}
                onChange={handleChange('apellido')}
                error={!!errors.apellido} helperText={errors.apellido}
                fullWidth required disabled={saving} size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>

          {/* ── Información laboral ── */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            <SectionHeader Icon={WorkOutlineIcon} label="INFORMACIÓN LABORAL" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Cargo / Posición" value={formData.cargo}
                onChange={handleChange('cargo')}
                error={!!errors.cargo} helperText={errors.cargo}
                fullWidth required disabled={saving} size="small" select
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {cargoOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Tipo de Contrato" value={formData.tipo_contrato}
                onChange={handleChange('tipo_contrato')}
                error={!!errors.tipo_contrato} helperText={errors.tipo_contrato}
                fullWidth required disabled={saving} size="small" select
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {tipoContratoOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* ── Área ── */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            <SectionHeader Icon={ApartmentOutlinedIcon} label="ÁREA" />

            {!showNuevaArea ? (
              <TextField
                label="Área del empleado" value={formData.area}
                onChange={handleChange('area')}
                error={!!errors.area} helperText={errors.area}
                fullWidth required disabled={saving} size="small" select
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {todasLasAreas.map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
                <Divider />
                <MenuItem value={NUEVA_AREA_VALUE} sx={{ color: 'primary.main', fontWeight: 700, gap: 1 }}>
                  <AddIcon sx={{ fontSize: 16 }} /> Agregar nueva área…
                </MenuItem>
              </TextField>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="Nombre de la nueva área"
                  value={nuevaAreaInput}
                  onChange={(e) => setNuevaAreaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAgregarArea()}
                  fullWidth size="small" autoFocus
                  helperText="Presiona Enter o haz clic en Agregar"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Button
                  variant="contained"
                  onClick={handleAgregarArea}
                  disabled={!nuevaAreaInput.trim()}
                  sx={{ mt: 0.1, borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap',
                    bgcolor: '#2563eb', boxShadow: 'none', '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' } }}
                >
                  Agregar
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => { setShowNuevaArea(false); setNuevaAreaInput(''); }}
                  sx={{ mt: 0.1, borderRadius: 2, textTransform: 'none', borderColor: 'divider', color: 'text.secondary' }}
                >
                  Cancelar
                </Button>
              </Box>
            )}

            {/* Chips de áreas personalizadas */}
            {areasExtra.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center', mr: 0.5 }}>
                  Personalizadas:
                </Typography>
                {areasExtra.map((a) => (
                  <Chip
                    key={a}
                    label={a}
                    size="small"
                    onClick={() => setFormData((prev) => ({ ...prev, area: a }))}
                    onDelete={() => {
                      setAreasExtra((prev) => prev.filter((x) => x !== a));
                      if (formData.area === a) setFormData((prev) => ({ ...prev, area: '' }));
                    }}
                    sx={{
                      height: 22, fontSize: '0.72rem', cursor: 'pointer',
                      bgcolor: formData.area === a ? '#eff6ff' : '#f1f5f9',
                      color: formData.area === a ? '#2563eb' : 'text.secondary',
                      fontWeight: formData.area === a ? 700 : 400,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* ── Fechas y duración ── */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            <SectionHeader Icon={CalendarTodayIcon} label="PERÍODO DEL CONTRATO" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="Fecha de Inicio" type="date"
                value={formData.fecha_ingreso}
                onChange={handleChange('fecha_ingreso')}
                error={!!errors.fecha_ingreso} helperText={errors.fecha_ingreso}
                fullWidth required disabled={saving} size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <TextField
                label="Fecha de Finalización" type="date"
                value={formData.fecha_fin}
                onChange={handleChange('fecha_fin')}
                error={!!errors.fecha_fin} helperText={errors.fecha_fin}
                fullWidth required disabled={saving} size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <TextField
                label="Duración (meses)" type="number"
                value={formData.duracion_meses || ''}
                onChange={handleChange('duracion_meses')}
                fullWidth disabled={saving} size="small"
                inputProps={{ min: 1, max: 36 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
            </Box>
          </Box>

          {/* ── Estado ── */}
          <Box>
            <SectionHeader Icon={BusinessOutlinedIcon} label="ESTADO DE LA SOLICITUD" />
            <TextField
              label="Estado" value={formData.request_status}
              onChange={handleChange('request_status')}
              fullWidth select disabled={saving} size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, maxWidth: 220 }}
            >
              {statusOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Box>

        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1.5 }}>
        <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit} disabled={saving} variant="contained"
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#2563eb', boxShadow: 'none', px: 3,
            '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' } }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : isEditing ? 'Guardar Cambios' : 'Guardar Contrato'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Subcomponente header de sección ─────────────────────────────────────────
const SectionHeader: React.FC<{ Icon: React.ElementType; label: string }> = ({ Icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    <Icon sx={{ color: 'primary.main', fontSize: 18 }} />
    <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
  </Box>
);

export default ContratoForm;