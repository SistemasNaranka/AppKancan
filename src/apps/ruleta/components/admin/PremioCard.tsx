import React from 'react';
import { Box, Typography, Card, CardContent, CardActions, IconButton, Tooltip, Fade, Chip } from '@mui/material';
import {
  EditNote as EditNoteIcon,
  DeleteForever as DeleteForeverIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { ISegment, Tienda } from '../../interfaces/ruleta.interface';
import { GRUPO_COLOR } from '../../utils/rangos';
import { AZUL, AZUL_BG, AZUL_HOVER } from '../../utils/constantes';
import {
  normKey,
  getInicial,
  getIconoDecorativo,
  calcularStockPremio,
  estiloRestante,
} from '../../utils/premios';

const PremioCardStyled = styled(Card)(() => ({
  borderRadius: '12px',
  border: '1px solid #d0d7de',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  width: '100%',
  maxWidth: '250px',
  flex: '1 1 200px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 16px rgba(0,70,128,0.14)',
    borderColor: AZUL,
  },
}));

const ColorCircle = styled(Box)<{ color: string }>(({ color }) => ({
  width: 42,
  height: 42,
  borderRadius: '50%',
  backgroundColor: color,
  border: '2.5px solid #ffffff',
  boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '1rem',
  fontFamily: "'Poppins', sans-serif",
  textShadow: '0 1px 4px rgba(0,0,0,0.25)',
  flexShrink: 0,
}));

const DecoratedBadge = styled(Box)({
  position: 'absolute',
  top: 8,
  right: 8,
  fontSize: '1.1rem',
  opacity: 0.22,
  transform: 'rotate(8deg)',
  pointerEvents: 'none',
});

interface PremioCardProps {
  premio: ISegment;
  storeFilterKey: string | null;
  selectedStoreName?: string;
  tiendas: Tienda[];
  onEdit: (premio: ISegment) => void;
  onDelete: (premio: ISegment) => void;
}

const PremioCard: React.FC<PremioCardProps> = ({
  premio,
  storeFilterKey,
  selectedStoreName,
  tiendas,
  onEdit,
  onDelete,
}) => {
  const inicial = getInicial(premio.label);
  const iconoDecorativo = getIconoDecorativo(premio.label);
  const meta = GRUPO_COLOR[premio.grupo];
  const { tiendasConCantidad, stockMostrado, restanteMostrado, entregadosMostrado } =
    calcularStockPremio(premio, storeFilterKey);
  const estiloQuedan = estiloRestante(restanteMostrado);

  return (
    <Fade in timeout={300}>
      <PremioCardStyled>
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(90deg, ${meta.color}, ${meta.colorDark})`,
          opacity: 0.9,
        }} />
        <DecoratedBadge>{iconoDecorativo}</DecoratedBadge>

        <CardContent sx={{ p: 1.75, pb: 1 }}>
          {/* Avatar + título */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
            <ColorCircle color={premio.color}>{inicial}</ColorCircle>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                fontWeight={700}
                color="#1E293B"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.15,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {premio.label}
              </Typography>
            </Box>
          </Box>

          {/* Chips: rango + Activo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
            <Chip
              label={meta.label}
              size="small"
              sx={{
                bgcolor: `${meta.color}20`,
                color: meta.color,
                fontWeight: 800,
                fontSize: '0.6rem',
                height: 18,
                border: `1px solid ${meta.color}50`,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
            <Chip
              label="Activo"
              size="small"
              sx={{
                bgcolor: '#E8F5E9',
                color: '#2E7D32',
                fontWeight: 600,
                fontSize: '0.58rem',
                height: 18,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Box>

          {/* Stock */}
          {(tiendasConCantidad > 0 || storeFilterKey) && (
            <Box sx={{
              pt: 0.75,
              borderTop: '1px dashed #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flexWrap: 'wrap',
            }}>
              <InventoryIcon sx={{ fontSize: 13, color: AZUL }} />

              {/* Total */}
              <Tooltip
                title={
                  storeFilterKey
                    ? `Total asignado en ${selectedStoreName ?? 'esta tienda'}`
                    : 'Total asignado sumando todas las tiendas'
                }
              >
                <Chip
                  label={`Total: ${stockMostrado}`}
                  size="small"
                  sx={{
                    bgcolor: AZUL_BG,
                    color: AZUL,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 18,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Tooltip>

              {/* Quedan */}
              <Tooltip
                title={
                  storeFilterKey
                    ? `Disponible en ${selectedStoreName ?? 'esta tienda'}`
                    : 'Disponible sumando todas las tiendas'
                }
              >
                <Chip
                  label={`Quedan: ${restanteMostrado}`}
                  size="small"
                  sx={{
                    bgcolor: estiloQuedan.bg,
                    color: estiloQuedan.color,
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    height: 18,
                    border: `1px solid ${estiloQuedan.border}`,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Tooltip>

              {/* Dados */}
              <Tooltip title="Premios ya entregados (Total − Quedan)">
                <Chip
                  label={`Dados: ${entregadosMostrado}`}
                  size="small"
                  sx={{
                    bgcolor: '#F1F5F9',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 18,
                    border: '1px solid #E2E8F0',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Tooltip>

              {/* Solo sin filtro: chip de "N tiendas" con tooltip detalle */}
              {!storeFilterKey && (
                <Tooltip
                  arrow
                  title={
                    <Box>
                      {Object.entries(premio.cantidadesPorTienda ?? {}).map(
                        ([storeCode, c]) => {
                          const t = tiendas.find(
                            (x) => normKey(x.ultra_code) === normKey(storeCode)
                          );
                          const r = premio.restantesPorTienda?.[storeCode] ?? 0;
                          return (
                            <div key={storeCode}>
                              {t?.name || `Tienda ${storeCode}`}: {r} / {c}
                            </div>
                          );
                        }
                      )}
                    </Box>
                  }
                >
                  <Chip
                    label={`${tiendasConCantidad} ${
                      tiendasConCantidad === 1 ? 'tienda' : 'tiendas'
                    }`}
                    size="small"
                    sx={{
                      bgcolor: '#F1F5F9',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.62rem',
                      height: 18,
                      cursor: 'help',
                      border: '1px solid #E2E8F0',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          )}
        </CardContent>

        <CardActions
          sx={{
            p: 1,
            pt: 0.5,
            justifyContent: 'flex-end',
            gap: 0.25,
            borderTop: '1px solid #E8EDF2',
          }}
        >
          <Tooltip title="Editar premio">
            <IconButton
              size="small"
              onClick={() => onEdit(premio)}
              sx={{
                color: AZUL,
                backgroundColor: AZUL_BG,
                borderRadius: '50%',
                p: 0.5,
                '&:hover': { backgroundColor: AZUL_HOVER, transform: 'scale(1.1)' },
                transition: 'all 0.2s',
              }}
            >
              <EditNoteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar premio">
            <IconButton
              size="small"
              onClick={() => onDelete(premio)}
              sx={{
                color: '#D32F2F',
                backgroundColor: '#FFEBEE',
                borderRadius: '50%',
                p: 0.5,
                '&:hover': { backgroundColor: '#FFCDD2', transform: 'scale(1.1)' },
                transition: 'all 0.2s',
              }}
            >
              <DeleteForeverIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </CardActions>
      </PremioCardStyled>
    </Fade>
  );
};

export default PremioCard;