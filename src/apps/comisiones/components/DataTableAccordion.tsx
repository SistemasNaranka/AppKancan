import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import {
  Store as StoreIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon, // ← AGREGADO
} from "@mui/icons-material";
import { TiendaResumen } from "../types";
import { formatCurrency } from "../lib/utils";
import { blue, grey } from "@mui/material/colors";
import PerformanceMessage from "./DataTableAccordion/PerformanceMessage";
import DataTableAccordionTable from "./DataTableAccordionTable";

interface DataTableAccordionProps {
  tienda: TiendaResumen;
  expanded: boolean;
  onToggle: () => void;
  readOnly: boolean;
  getCumplimientoColor: (pct: number) => string;
  handleVentaChange: (
    tiendaName: string,
    fecha: string,
    asesorId: string,
    newValue: string
  ) => void;
}

const AccordionHeader = ({
  tienda,
  expanded,
  onToggle,
  getCumplimientoColor,
  empleadosVisibles = 0,
}: {
  tienda: TiendaResumen;
  expanded: boolean;
  onToggle: () => void;
  getCumplimientoColor: (pct: number) => string;
  empleadosVisibles?: number; // Nuevo prop para el conteo real de empleados visibles
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Calcular comisión total una sola vez
  const totalComision = tienda.empleados.reduce(
    (t, e) => t + (e.comision_monto || 0),
    0
  );

  // Determinar el conteo a mostrar
  const conteoEmpleados =
    empleadosVisibles > 0 ? empleadosVisibles : tienda.empleados.length;

  return (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        backgroundColor: expanded ? grey[100] : "rgba(0,0,0,0.02)",
        borderBottom: expanded
          ? "1px solid" + blue[50]
          : "1px solid" + grey[200],
        minHeight: isMobile ? "auto" : 48,
        height: "auto",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor: expanded ? blue[100] : grey[100],
        },
        padding: isMobile ? "10px 12px" : "8px 16px",
        flexWrap: isMobile ? "wrap" : "nowrap",
      }}
    >
      <StoreIcon
        color="primary"
        sx={{ flexShrink: 0, fontSize: isMobile ? 18 : 18 }}
      />

      <Box
        flex={1}
        minWidth={0}
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        alignItems={isMobile ? "flex-start" : "center"}
        gap={isMobile ? 0.5 : 2}
      >
        {isMobile ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              gap: 1,
            }}
          >
            {/* Nombre */}
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{
                flex: 1,
                fontSize: "0.9rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
              title={tienda.tienda}
            >
              {tienda.tienda}
            </Typography>

            {/* Empleados con icono */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              <PeopleIcon sx={{ fontSize: 14 }} />
              <Typography fontSize="0.75rem">{conteoEmpleados}</Typography>
            </Box>

            {/* Flecha expandir */}
            <ExpandMoreIcon
              sx={{
                fontSize: 20,
                flexShrink: 0,
                transition: "transform 0.2s",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                color: expanded ? "primary.main" : "text.secondary",
              }}
            />
          </Box>
        ) : (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              flexShrink: 1,
              fontSize: "0.875rem",
              maxWidth: "200px",
              wordBreak: "break-word",
              overflow: "visible",
              textOverflow: "ellipsis",
            }}
            title={tienda.tienda}
          >
            {tienda.tienda}
          </Typography>
        )}

        {isMobile ? (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            {/* COLUMNA IZQUIERDA: Ppto, Ventas, Cumplimiento */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* Presupuesto */}
              <Typography
                fontSize="0.75rem"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Ppto: {formatCurrency(tienda.presupuesto_tienda)}
              </Typography>

              {/* Ventas */}
              <Typography
                fontSize="0.75rem"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Ventas: {formatCurrency(tienda.ventas_tienda)}
              </Typography>

              {/* Cumplimiento con color + PerformanceMessage */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography fontSize="0.75rem">Cumpl:</Typography>
                <Typography
                  fontSize="0.75rem"
                  fontWeight={600}
                  sx={{
                    color: getCumplimientoColor(tienda.cumplimiento_tienda_pct),
                  }}
                >
                  {tienda.cumplimiento_tienda_pct.toFixed(2)}%
                </Typography>
                <PerformanceMessage tienda={tienda} size="small" />
              </Box>
            </Box>

            {/* COLUMNA DERECHA: Comisión */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                flexShrink: 0,
                color: "green",
              }}
            >
              <AttachMoneyIcon sx={{ fontSize: 16 }} />
              <Typography
                fontSize="0.75rem"
                fontWeight={600}
                sx={{
                  maxWidth: "90px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={formatCurrency(totalComision)}
              >
                {formatCurrency(totalComision)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{
              fontSize: "0.875rem",
              color: "#6b7280",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            <span>Ppto: {formatCurrency(tienda.presupuesto_tienda)}</span>
            <span>Ventas: {formatCurrency(tienda.ventas_tienda)}</span>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.875rem",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Cumplimiento:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: getCumplimientoColor(tienda.cumplimiento_tienda_pct),
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {tienda.cumplimiento_tienda_pct.toFixed(2)}%
              </Typography>
            </Box>
            <PerformanceMessage tienda={tienda} size="medium" />
          </Box>
        )}
      </Box>

      {!isMobile && (
        <Box
          display="flex"
          flexShrink={0}
          alignItems="center"
          gap={2}
          sx={{ whiteSpace: "nowrap" }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 400 }}
          >
            {conteoEmpleados} empleados
          </Typography>

          <Typography
            variant="body2"
            fontWeight="bold"
            color="green"
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            <AttachMoneyIcon fontSize="small" />
            {formatCurrency(totalComision)}
          </Typography>

          <ExpandMoreIcon
            sx={{
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              color: expanded ? "primary.main" : "text.secondary",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export const DataTableAccordion = React.memo<DataTableAccordionProps>(
  ({
    tienda,
    expanded,
    onToggle,
    readOnly,
    getCumplimientoColor,
    handleVentaChange,
  }) => {
    // ✅ CALCULAR EMPLEADOS VISIBLES (filtrar 0 presupuesto Y 0 ventas)
    const empleadosVisibles = React.useMemo(() => {
      return tienda.empleados.filter(
        (empleado) => empleado.presupuesto > 0 || empleado.ventas > 0
      ).length;
    }, [tienda.empleados]);

    return (
      <Box
        key={`${tienda.tienda}-${tienda.fecha}-${expanded}`}
        sx={{
          border: "1px solid #d1d5db",
          borderRadius: 1,
          mb: 1,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
          width: "100%",
          maxWidth: "100%",
          margin: 0,
          boxSizing: "border-box",
          wordBreak: "break-word",
        }}
      >
        <AccordionHeader
          tienda={tienda}
          expanded={expanded}
          onToggle={onToggle}
          getCumplimientoColor={getCumplimientoColor}
          empleadosVisibles={empleadosVisibles}
        />

        <Box
          sx={{
            overflow: "hidden",
            display: expanded ? "block" : "none",
            transition: "none",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <DataTableAccordionTable
            tienda={tienda}
            readOnly={readOnly}
            getCumplimientoColor={getCumplimientoColor}
            handleVentaChange={handleVentaChange}
          />
        </Box>
      </Box>
    );
  },
  (prevProps: any, nextProps: any) => {
    // Comparación más estricta para evitar renders innecesarios
    const tiendaChanged =
      prevProps.tienda.tienda !== nextProps.tienda.tienda ||
      prevProps.tienda.fecha !== nextProps.tienda.fecha;

    const dataChanged =
      prevProps.tienda.total_comisiones !== nextProps.tienda.total_comisiones ||
      prevProps.tienda.empleados.length !== nextProps.tienda.empleados.length;

    const expandedChanged = prevProps.expanded !== nextProps.expanded;

    // Solo permitir re-render si hay cambios importantes
    return !tiendaChanged && !dataChanged && !expandedChanged;
  }
);

DataTableAccordion.displayName = "DataTableAccordion";

export default DataTableAccordion;
