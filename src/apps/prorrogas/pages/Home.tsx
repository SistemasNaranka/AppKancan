import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { theme } from '../lib/theme';
import { ContractProvider } from '../contexts/Contractcontext';
import TopBar from '../components/TopBar';
import TabsNav from '../components/TabsNav';
import StatCards from '../components/StatCards';
import ContractTable from '../components/ContractTable';
import ContractDetail from '../components/ContractDetail';
import ProrrogaForm from '../components/ProrrogaForm';
import ContratoForm from '../components/ContratoForm';
import { useContracts } from '../hooks/useContracts';
import { CreateContrato } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Inner — consume el contexto (debe estar dentro de ContractProvider)
// ─────────────────────────────────────────────────────────────────────────────

const Inner: React.FC = () => {
  const { loading, selectedContrato, filters, addContrato } = useContracts();
  const [formContractId, setFormContractId] = useState<number | null>(null);
  const [newContratoOpen, setNewContratoOpen] = useState(false);

  const handleOpenForm  = (id: number) => setFormContractId(id);
  const handleCloseForm = () => setFormContractId(null);
  const handleNewContratoOpen = () => setNewContratoOpen(true);
  const handleNewContratoClose = () => setNewContratoOpen(false);
  const handleNewContratoSubmit = async (data: CreateContrato) => {
    await addContrato(data);
    setNewContratoOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">Cargando contratos…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />
      <TabsNav />

      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 }, position: 'relative' }}>
        {selectedContrato ? (
          <ContractDetail onOpenForm={() => handleOpenForm(selectedContrato.id)} />
        ) : (
          <>
            {filters.tab === 'resumen' && <StatCards />}
            <ContractTable onOpenForm={handleOpenForm} />
          </>
        )}

        {/* FAB para nuevo contrato */}
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleNewContratoOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {formContractId !== null && (
        <ProrrogaForm
          contractId={formContractId}
          open={true}
          onClose={handleCloseForm}
        />
      )}

      <ContratoForm
        open={newContratoOpen}
        onClose={handleNewContratoClose}
        onSubmit={handleNewContratoSubmit}
      />
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Home — inyecta providers y renderiza Inner
// ─────────────────────────────────────────────────────────────────────────────

const Home: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <ContractProvider>
      <Inner />
    </ContractProvider>
  </ThemeProvider>
);

export default Home;