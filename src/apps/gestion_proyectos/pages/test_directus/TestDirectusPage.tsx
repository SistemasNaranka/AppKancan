import { useState } from 'react';
import { Box } from '@mui/material';

import HeaderSticky from './components/HeaderSticky';
import PlaygroundTab from './components/PlaygroundTab';
import GuidedChallengesTab from './components/GuidedChallengesTab';
import ErrorLabTab from './components/ErrorLabTab';
import CheatSheetTab from './components/CheatSheetTab';

import { TutorialChallenge, ErrorScenario } from '../../lib/DirectusTutorialData';
import {
  RequestConfig,
  DiagnosticResult,
  executeDirectusTest,
} from '../../lib/DirectusTestHelper';

export default function TestDirectusPage() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeErrorSimulationName, setActiveErrorSimulationName] = useState<string | null>(null);
  const [refreshTableCount, setRefreshTableCount] = useState<number>(0);

  // Configuración de la Solicitud activa
  const [config, setConfig] = useState<RequestConfig>({
    collection: 'test_products',
    action: 'readItems',
    fields: 'id, name, price, stock, category_id.name',
    filter: '{\n  "status": {\n    "_eq": "disponible"\n  }\n}',
    sort: 'name',
    limit: 5,
    payload: '{\n  "category_id": 1,\n  "sku": "SKU-RGB-001",\n  "name": "RGB Gaming Mouse",\n  "price": 85000,\n  "stock": 15,\n  "status": "disponible"\n}',
    id: '1',
    safeMode: true,
  });

  // Estado del Ejecutor de Pruebas
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleRunTest = async (overrideConfig?: RequestConfig) => {
    const targetConfig = overrideConfig ? { safeMode: config.safeMode, ...overrideConfig } : config;
    setLoading(true);
    setResult(null);
    const diag = await executeDirectusTest(targetConfig);
    setResult(diag);
    setLoading(false);
    setRefreshTableCount((prev) => prev + 1);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const loadChallenge = (ch: TutorialChallenge) => {
    setActiveErrorSimulationName(null);
    setConfig({
      collection: ch.hintQuery.collection,
      action: ch.hintQuery.action,
      fields: ch.hintQuery.fields || '',
      filter: ch.hintQuery.filter || '',
      sort: '-date_created',
      limit: ch.hintQuery.limit || 5,
      payload: ch.hintQuery.payload || '',
      id: '1',
    });
    setActiveTab(0);
  };

  const loadErrorScenario = (scenario: ErrorScenario) => {
    setActiveErrorSimulationName(scenario.name);
    const targetConfig: RequestConfig = {
      collection: scenario.howToTrigger.collection,
      action: scenario.howToTrigger.action,
      fields: scenario.howToTrigger.fields || '',
      filter: scenario.howToTrigger.filter || '',
      payload: scenario.howToTrigger.payload || '',
      id: scenario.howToTrigger.id || '1',
      limit: 1,
      safeMode: config.safeMode,
    };
    setConfig(targetConfig);
    setActiveTab(0);
    handleRunTest(targetConfig);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1800, margin: '0 auto', minHeight: '100vh' }}>
      {/* Header Sticky */}
      <HeaderSticky
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        copySuccess={copySuccess}
      />

      {/* Tab 1: Playground & Visor 4-en-1 */}
      {activeTab === 0 && (
        <PlaygroundTab
          config={config}
          setConfig={setConfig}
          loading={loading}
          result={result}
          activeErrorSimulationName={activeErrorSimulationName}
          setActiveErrorSimulationName={setActiveErrorSimulationName}
          handleRunTest={handleRunTest}
          handleCopy={handleCopy}
          refreshTableCount={refreshTableCount}
        />
      )}

      {/* Tab 2: Ejercicios Guiados */}
      {activeTab === 1 && (
        <GuidedChallengesTab loadChallenge={loadChallenge} />
      )}

      {/* Tab 3: Laboratorio de Errores */}
      {activeTab === 2 && (
        <ErrorLabTab loadErrorScenario={loadErrorScenario} />
      )}

      {/* Tab 4: Cheat Sheet & Diccionario SDK */}
      {activeTab === 3 && (
        <CheatSheetTab />
      )}
    </Box>
  );
}
