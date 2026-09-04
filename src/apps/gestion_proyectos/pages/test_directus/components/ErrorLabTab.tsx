import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { ERROR_LAB_SCENARIOS, ErrorScenario } from '../../../lib/DirectusTutorialData';

interface ErrorLabTabProps {
  loadErrorScenario: (scenario: ErrorScenario) => void;
}

export default function ErrorLabTab({ loadErrorScenario }: ErrorLabTabProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(ERROR_LAB_SCENARIOS[0].id);

  const activeScenario = ERROR_LAB_SCENARIOS.find((sc) => sc.id === selectedScenarioId) || ERROR_LAB_SCENARIOS[0];

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReportIcon color="error" /> Diagnóstico e Inspector de Errores
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Selecciona un escenario de error para analizar su causa raíz, la recomendación de solución y simular su comportamiento en vivo.
      </Typography>

      <Grid container spacing={3}>
        {/* Lado Izquierdo: Lista Maestra de Escenarios de Error */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {ERROR_LAB_SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <Card
                  key={sc.id}
                  variant="outlined"
                  onClick={() => setSelectedScenarioId(sc.id)}
                  sx={{
                    cursor: 'pointer',
                    borderColor: isSelected ? '#ef4444' : '#e2e8f0',
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isSelected ? '#fef2f2' : '#ffffff',
                    transition: 'all 0.2s',
                    '&:hover': { shadow: 2 },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Chip label={`HTTP ${sc.httpStatus}`} color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#991b1b' }}>
                        {sc.code}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {sc.name}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Grid>

        {/* Lado Derecho: Inspector Detallado del Error Seleccionado */}
        <Grid size={{ xs: 12, md: 8 }}>
          {activeScenario && (
            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 3,
                borderColor: '#fca5a5',
                backgroundColor: '#fafafa',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {activeScenario.title}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#991b1b', fontWeight: 700 }}>
                      Código Directus: {activeScenario.code}
                    </Typography>
                  </Box>
                </Box>
                <Chip label={`HTTP Status ${activeScenario.httpStatus}`} color="error" sx={{ fontWeight: 700 }} />
              </Box>

              <Typography variant="body2" sx={{ color: '#334155', mb: 3, lineHeight: 1.6 }}>
                {activeScenario.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ p: 2.5, backgroundColor: '#fff1f2', borderRadius: 2, border: '1px solid #fecdd3', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#9f1239', display: 'block', mb: 0.5 }}>
                  CAUSA RAÍZ EN BD / DIRECTUS:
                </Typography>
                <Typography variant="body2" sx={{ color: '#881337', lineHeight: 1.5 }}>
                  {activeScenario.rootCause}
                </Typography>
              </Box>

              <Box sx={{ p: 2.5, backgroundColor: '#ecfdf5', borderRadius: 2, border: '1px solid #a7f3d0', mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <CheckCircleOutlineIcon fontSize="small" /> SOLUCIÓN RECOMENDADA:
                </Typography>
                <Typography variant="body2" sx={{ color: '#047857', lineHeight: 1.5 }}>
                  {activeScenario.solution}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="error"
                size="large"
                startIcon={<BugReportIcon />}
                onClick={() => loadErrorScenario(activeScenario)}
                sx={{ py: 1.4, borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '0.98rem' }}
              >
                Simular este Error en Vivo en el Playground
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
