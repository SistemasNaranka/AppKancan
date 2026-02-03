import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { Resolucion } from "../types";
import StatusBadge from "./StatusBadge";

interface ResolutionTableProps {
  resoluciones: Resolucion[];
  onSeleccionar: (resolucion: Resolucion) => void;
}

// Función para obtener el color de fondo según el estado
const getRowBackgroundColor = (estado: string, index: number): string => {
  switch (estado) {
    case "Vencido":
      return "#ffebee"; // Rojo claro
    case "Por vencer":
      return "#fff3e0"; // Naranja claro
    case "Pendiente":
      return "#989898"; // Azul claro
    default:
      // Zebra striping para los demás
      return index % 2 === 0 ? "#ffffff" : "#f5f5f5";
  }
};

const ResolutionTable: React.FC<ResolutionTableProps> = ({
  resoluciones,
  onSeleccionar,
}) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        overflowX: "auto",
        minWidth: { xs: 500, sm: 600 },
      }}
    >
      <Table sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#015aa3e8" }}>
            <TableCell
              sx={{
                fontWeight: "bold",
                width: { xs: 100, sm: 130 },
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              Resolución
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                width: { xs: 120, sm: 140 },
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              Ubicación
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                width: { xs: 60, sm: 70 },
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              Prefijo
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                width: { xs: 100, sm: 120 },
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              Ente
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                width: { xs: 70, sm: 80 },
                color: "white",
                whiteSpace: "nowrap",
              }}
            >
              Estado
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resoluciones.length > 0 ? (
            resoluciones.map((resolucion, index) => (
              <TableRow
                key={resolucion.id}
                onClick={() => onSeleccionar(resolucion)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: getRowBackgroundColor(
                    resolucion.estado,
                    index,
                  ),
                  "&:hover": {
                    backgroundColor: "#026ac01d",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    {resolucion.numero_formulario}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    {resolucion.tienda_nombre}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    {resolucion.prefijo}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    {resolucion.ente_facturador}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <StatusBadge estado={resolucion.estado} mostrarTexto />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography
                  sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
                >
                  No hay resoluciones
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResolutionTable;
