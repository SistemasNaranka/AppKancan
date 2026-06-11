import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { theme } from '../lib/theme';
import { ContractProvider } from '../contexts/ContractContext';
import TopBar from '../components/TopBar';
import TabsNav from '../components/TabsNav';
import StatCards from '../components/StatCards';
import ContractTable from '../components/ContractTable';
import ContractDetail from '../components/ContractDetail';
import ProrrogaForm from '../components/ProrrogaForm';
import ContratoForm from '../components/ContratoForm';
import ContractSelectorModal from '../components/ContractSelectorModal';
import EmployeeGrid from '../components/EmployeeGrid';
import { useContracts } from '../hooks/useContracts';
import { useContractContext } from '../contexts/ContractContext';
import { CreateContract } from '../types/types';

const Inner: React.FC = () => {
  const { loading, selectedContract, filters, addContract } = useContracts();
  const [formContractId, setFormContractId] = useState<number | null>(null);
  const [newContratoOpen, setNewContratoOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleOpenForm  = (id: number) => setFormContractId(id);
  const handleCloseForm = () => setFormContractId(null);
  
  const handleNewContractOpen = () => setNewContratoOpen(true);
  const handleNewContractClose = () => setNewContratoOpen(false);
  const handleNewContractSubmit = async (data: CreateContract) => {
    await addContract(data);
    setNewContratoOpen(false);
  };

  const { updateContract } = useContractContext();
  const [editingContract, setEditingContract] = useState<any>(null);

  const handleEditContractSubmit = async (data: any) => {
    if (editingContract) {
      await updateContract(editingContract.id, data);
      setEditingContract(null);
    }
  };

  const handleOpenSelector = () => setSelectorOpen(true);
  const handleCloseSelector = () => setSelectorOpen(false);
  const handleSelectContract = (id: number) => {
    handleOpenForm(id);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Cargando contracts…
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <TopBar />
      <TabsNav />

      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 }, position: 'relative' }}>
        {selectedContract ? (
          <ContractDetail
            onOpenForm={() => handleOpenForm(selectedContract.id)}
            onEditContract={() => setEditingContract(selectedContract)}
          />
        ) : filters.tab === 'empleados' ? (
          <EmployeeGrid onEditContract={(emp) => setEditingContract(emp)} />
        ) : (
          <>
            {filters.tab === 'resumen' && <StatCards />}
            <ContractTable 
              onOpenForm={handleOpenForm}
              onNewContractClick={handleNewContractOpen}
              onRequestProrrogaClick={handleOpenSelector}
            />
          </>
        )}

        {/* FAB para nuevo contrato */}
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleNewContractOpen}
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
        onClose={handleNewContractClose}
        onSubmit={handleNewContractSubmit}
      />

      {editingContract && (
        <ContratoForm
          open={!!editingContract}
          onClose={() => setEditingContract(null)}
          onSubmit={handleEditContractSubmit}
          initialData={editingContract}
        />
      )}

      <ContractSelectorModal
        open={selectorOpen}
        onClose={handleCloseSelector}
        onSelect={handleSelectContract}
      />
    </Box>
  );
};

const Home: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <ContractProvider>
      <Inner />
    </ContractProvider>
  </ThemeProvider>
);

export default Home;