import React from "react";
import { Box } from "@mui/material";
import { ArticulosList } from "./scanner/ArticulosList";
import { ActionButtons } from "./scanner/ActionButtons";

interface ScannerListProps {
  articulos: Array<{ codigo: string; cantidad: number }>;
  onDelete: (codigo: string) => void;
  onReduce: (codigo: string) => void;
  hasData: boolean;
  isLoading: boolean;
  onEnviar: () => void;
  onCancelar: () => void;
}

const ScannerList: React.FC<ScannerListProps> = ({
  articulos,
  onDelete,
  onReduce,
  hasData,
  onEnviar,
  onCancelar,
}) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0, // Importante para que el scroll funcione correctamente
      }}
    >
      {/* ÁREA CON SCROLL PARA LA LISTA */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          px: { xs: 1, sm: 0 },
          // Estilos del scrollbar (opcional, para mejor apariencia)
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.3)",
            },
          },
        }}
      >
        <ArticulosList
          articulos={articulos}
          onDelete={onDelete}
          onReduce={onReduce}
        />
      </Box>

      {/* BOTONES FIJOS AL FINAL - Solo aparecen cuando hay datos */}
      {hasData && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            p: 0.5,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            // Sombra sutil para separar visualmente
            boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
            zIndex: 10,
          }}
        >
          <ActionButtons
            hasData={hasData}
            onEnviar={onEnviar}
            onCancelar={onCancelar}
          />
        </Box>
      )}
    </Box>
  );
};

export default ScannerList;
