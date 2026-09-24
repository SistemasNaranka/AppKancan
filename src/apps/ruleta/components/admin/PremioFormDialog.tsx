import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  EditNote as EditNoteIcon,
  Close as CloseIcon,
  Inventory2 as InventoryIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { TGrupo, Tienda } from '../../interfaces/ruleta.interface';
import { GRUPO_COLOR } from '../../utils/rangos';
import { AZUL, AZUL_BG, AZUL_BORDER } from '../../utils/constantes';
import { normKey, estiloRestante } from '../../utils/premios';

interface PremioFormDialogProps {
  open: boolean;
  editingPremioId: number | null;
  formLabel: string;
  setFormLabel: (value: string) => void;
  formGrupo: TGrupo;
  setFormGrupo: (value: TGrupo) => void;
  formCantidadesPorTienda: Record<string, string>;
  setFormCantidadesPorTienda: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  restantesDelPremioEditado: Record<string, number>;
  tiendas: Tienda[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PremioFormDialog: React.FC<PremioFormDialogProps> = ({
  open,
  editingPremioId,
  formLabel,
  setFormLabel,
  formGrupo,
  setFormGrupo,
  formCantidadesPorTienda,
  setFormCantidadesPorTienda,
  restantesDelPremioEditado,
  tiendas,
  saving,
  onClose,
  onSave,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}
  >
    <DialogTitle sx={{
      m: 0, p: 2.5,
      background: `linear-gradient(135deg, ${AZUL}, #003366)`,
      color: '#ffffff', fontWeight: 700,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {editingPremioId != null ? (
          <>
            <EditNoteIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>Editar premio</Typography>
          </>
        ) : (
          <>
            <AddIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>Agregar nuevo premio</Typography>
          </>
        )}
      </Box>
      <IconButton onClick={onClose} sx={{ color: '#ffffff' }} disabled={saving}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>

    <DialogContent sx={{ p: 3, bgcolor: '#fafbfc' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
        {/* VISTA PREVIA */}
        <Box sx={{
          p: 2.5, borderRadius: '16px', bgcolor: '#ffffff',
          border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: GRUPO_COLOR[formGrupo].color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontWeight: 800, fontSize: '1.6rem',
            fontFamily: "'Poppins', sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s ease',
          }}>
            {formLabel ? formLabel.trim().charAt(0).toUpperCase() : '?'}
          </Box>
          <Box>
            <Typography variant="body2" color="#94A3B8" fontWeight={500}>Vista previa</Typography>
            <Typography variant="h6" fontWeight={700} color="#1E293B" sx={{ fontFamily: "'Poppins', sans-serif" }}>
              {formLabel || 'Nombre del premio'}
            </Typography>
            <Typography variant="caption" color="#94A3B8">
              Rango: <span style={{ fontWeight: 600, color: GRUPO_COLOR[formGrupo].color }}>
                {GRUPO_COLOR[formGrupo].label}
              </span>
            </Typography>
          </Box>
        </Box>

        {/* NOMBRE */}
        <TextField
          label="Nombre del premio *"
          value={formLabel}
          onChange={(e) => setFormLabel(e.target.value)}
          fullWidth
          size="medium"
          autoFocus
          placeholder="Ej: Jean de línea"
          required
          disabled={saving}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px', bgcolor: '#ffffff',
              '&:hover fieldset': { borderColor: AZUL },
              '&.Mui-focused fieldset': { borderColor: AZUL, borderWidth: '2px' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: AZUL },
          }}
        />

        {/* RANGO */}
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.5 }}>
            Selecciona un rango
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, p: 1.5, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            {(Object.keys(GRUPO_COLOR) as TGrupo[]).map((g) => {
              const selected = formGrupo === g;
              const meta = GRUPO_COLOR[g];
              return (
                <Box
                  key={g}
                  onClick={() => !saving && setFormGrupo(g)}
                  sx={{
                    flex: 1, cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.6 : 1, borderRadius: '10px', p: 1.25,
                    border: selected ? `2px solid ${meta.color}` : '2px solid #E2E8F0',
                    bgcolor: selected ? `${meta.color}15` : '#ffffff',
                    display: 'flex', alignItems: 'center', gap: 1.25,
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: saving ? undefined : meta.color },
                  }}
                >
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: meta.color, border: '2px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                  <Box sx={{ lineHeight: 1.2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1E293B' }}>{g}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>{meta.label}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* CANTIDAD / STOCK */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '10px',
              background: `linear-gradient(135deg, ${AZUL}, #003366)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: `0 4px 10px -2px ${AZUL}66`,
            }}>
              <InventoryIcon sx={{ fontSize: 18, color: '#fff' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: AZUL, lineHeight: 1.15, fontFamily: "'Poppins', sans-serif" }}>
                Stock por tienda
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, lineHeight: 1.3 }}>
                Total asignado · El chip muestra el disponible real
              </Typography>
            </Box>
          </Box>

          <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '14px', border: `1px solid ${AZUL_BORDER}` }}>
            <Box sx={{
              display: 'flex', flexDirection: 'column', gap: 0.75,
              maxHeight: 320, overflowY: 'auto', pr: 0.5,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: AZUL_BORDER, borderRadius: 3 },
            }}>
              {tiendas.length === 0 ? (
                <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  Cargando tiendas...
                </Typography>
              ) : (
                tiendas.map((t, index) => {
                  const storeKey = normKey(t.ultra_code);
                  const restante = restantesDelPremioEditado[storeKey];
                  const colorRestante =
                    restante === undefined ? '#94A3B8' : estiloRestante(restante).color;

                  return (
                    <Box
                      key={t.id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        bgcolor: index % 2 === 0 ? '#F8FAFC' : '#ffffff',
                        borderRadius: '10px', px: 1.25, py: 0.75,
                        border: '1px solid #E8EEF4', transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: AZUL_BG, borderColor: AZUL_BORDER },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                        <StorefrontIcon sx={{ fontSize: 16, color: '#94A3B8', flexShrink: 0 }} />
                        <Typography sx={{
                          fontSize: '0.8rem', fontWeight: 600, color: '#1E293B',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.name}
                        </Typography>
                      </Box>

                      <TextField
                        type="number"
                        size="small"
                        value={formCantidadesPorTienda[storeKey] ?? ''}
                        onChange={(e) =>
                          setFormCantidadesPorTienda((prev) => ({
                            ...prev, [storeKey]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        disabled={saving}
                        inputProps={{ min: 0 }}
                        sx={{
                          width: 68,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px', bgcolor: '#fff',
                            fontSize: '0.85rem', fontWeight: 700,
                            '& input': { textAlign: 'center', padding: '6px 8px', color: AZUL },
                            '& fieldset': { borderColor: AZUL_BORDER },
                            '&:hover fieldset': { borderColor: AZUL },
                            '&.Mui-focused fieldset': { borderColor: AZUL, borderWidth: '2px' },
                          },
                        }}
                      />

                      {restante !== undefined && (
                        <Tooltip title="Disponible en Directus">
                          <Typography sx={{
                            fontSize: '0.7rem', fontWeight: 800,
                            color: colorRestante, bgcolor: `${colorRestante}18`,
                            border: `1px solid ${colorRestante}40`,
                            px: 0.85, py: 0.4, borderRadius: '6px',
                            whiteSpace: 'nowrap', minWidth: 38, textAlign: 'center',
                          }}>
                            {restante}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </DialogContent>

    <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid #E2E8F0', bgcolor: '#ffffff', gap: 1 }}>
      <Button
        onClick={onClose}
        disabled={saving}
        sx={{
          textTransform: 'none', borderRadius: '10px', fontWeight: 600,
          px: 3, color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' },
        }}
      >
        Cancelar
      </Button>
      <Button
        onClick={onSave}
        variant="contained"
        disableElevation
        disabled={saving}
        startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
        sx={{
          bgcolor: AZUL, textTransform: 'none', fontWeight: 700,
          borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#003366' },
        }}
      >
        {saving ? 'Guardando...' : editingPremioId != null ? 'Actualizar premio' : 'Guardar premio'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default PremioFormDialog;