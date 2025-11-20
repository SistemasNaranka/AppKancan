// src/components/ScannerForm.tsx
import React, { useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { BodegaInput } from "./scanner/BodegaInput";
import { ScannerInput } from "./scanner/ScannerInput";

interface ScannerFormProps {
  bodega: string;
  bodegas: Array<{ codigo: string; nombre: string }>;
  codigoInput: string;
  setCodigoInput: (value: string) => void;
  isScanning: boolean;
  totalItems: number;
  onBodegaChange: (value: string) => void;
  onAgregarCodigo: (codigo: string) => void;
}

const ScannerForm: React.FC<ScannerFormProps> = ({
  bodega,
  bodegas,
  codigoInput,
  setCodigoInput,
  isScanning,

  onBodegaChange,
  onAgregarCodigo,
}) => {
  const scannerRef = useRef<HTMLInputElement>(null);
  const bodegaRef = useRef<HTMLInputElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && scannerRef.current) {
      scannerRef.current.focus();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const handleKeyDownInternal = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && codigoInput.trim()) {
      onAgregarCodigo(codigoInput);
      setTimeout(() => scannerRef.current?.focus(), 100);
    }
  };

  return (
    <Box sx={{ mb: 0, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 3, sm: 5, md: 8, lg: 65 },
          alignItems: "stretch",
          justifyContent: "center",
          mt: 1,
          px: { xs: 1, sm: 2 },
          width: "100%",
        }}
      >
        {/* Contenedor centrado para BodegaInput */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: { xs: "100%", sm: "auto" },
            flex: { sm: "0 0 auto" },
          }}
        >
          <BodegaInput
            ref={bodegaRef}
            value={bodega}
            options={bodegas}
            onChange={onBodegaChange}
            onBlur={() => setTimeout(() => scannerRef.current?.focus(), 100)}
            onFocus={() => {}}
          />
        </Box>

        {/* Contenedor centrado para ScannerInput */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: { xs: "100%", sm: "auto" },
            flex: { sm: "0 0 auto" },
          }}
        >
          <ScannerInput
            ref={scannerRef}
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value)}
            onKeyDown={handleKeyDownInternal}
            onAgregarReferencia={onAgregarCodigo}
            isScanning={isScanning}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ScannerForm;
