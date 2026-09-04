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
  Alert,
  AlertTitle,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorageIcon from '@mui/icons-material/Storage';

import { TUTORIAL_CHALLENGES, TutorialChallenge } from '../../../lib/DirectusTutorialData';

interface GuidedChallengesTabProps {
  loadChallenge: (ch: TutorialChallenge) => void;
}

export default function GuidedChallengesTab({ loadChallenge }: GuidedChallengesTabProps) {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  const activeChallenge = TUTORIAL_CHALLENGES[currentChallengeIndex];

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
            Retos Interactivos de Aprendizaje
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Selecciona un reto para cargar su estructura en el Playground y poner a prueba tu lógica de consultas.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {TUTORIAL_CHALLENGES.map((ch, idx) => {
              const isCurrent = idx === currentChallengeIndex;
              const isDone = completedChallenges.includes(ch.id);
              return (
                <Card
                  key={ch.id}
                  variant="outlined"
                  onClick={() => setCurrentChallengeIndex(idx)}
                  sx={{
                    cursor: 'pointer',
                    borderColor: isCurrent ? '#2563eb' : isDone ? '#10b981' : '#e2e8f0',
                    borderWidth: isCurrent ? 2 : 1,
                    backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s',
                    '&:hover': { shadow: 2 },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Chip
                        label={ch.levelTitle}
                        size="small"
                        color={isCurrent ? 'primary' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                      {isDone && <CheckCircleIcon color="success" fontSize="small" />}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {ch.title}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        {activeChallenge && (
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Chip label={activeChallenge.levelTitle} color="primary" sx={{ fontWeight: 700, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
              {activeChallenge.title}
            </Typography>
            <Typography variant="body1" sx={{ color: '#334155', mb: 3, lineHeight: 1.6 }}>
              {activeChallenge.description}
            </Typography>

            <Alert severity="info" icon={<StorageIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>Equivalente Conceptual en SQL:</AlertTitle>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {activeChallenge.dbConcept}
              </Typography>
            </Alert>

            <Box sx={{ p: 2.5, backgroundColor: '#f1f5f9', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Explicación Técnica:
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {activeChallenge.explanation}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() => loadChallenge(activeChallenge)}
                sx={{ py: 1.2, px: 3, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Cargar y Probar en Playground
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  if (!completedChallenges.includes(activeChallenge.id)) {
                    setCompletedChallenges([...completedChallenges, activeChallenge.id]);
                  }
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {completedChallenges.includes(activeChallenge.id) ? 'Reto Completado' : 'Marcar como Aprendido'}
              </Button>
            </Box>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
}
