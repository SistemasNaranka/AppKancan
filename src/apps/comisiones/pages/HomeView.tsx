import React from "react";
import { 
  Box, 
  Typography, 
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";
import { Global } from "@emotion/react";
import { MobileAccordionFilters } from "../components/MobileAccordionFilters";
import { DataTable } from "../components/DataTable";
import { SummaryCards } from "../components/SummaryCards";
import { Charts } from "../components/Charts";
import { ExportButtons } from "../components/ExportButtons";
import { ConfigurationPanel } from "../components/ConfigurationPanel";
import { CodesModal } from "../components/CodesModal";
import { NoDataModal } from "../components/NoDataModal";
import { Warning } from "@mui/icons-material";
import { Role } from "../types";

export interface HomeViewProps {
  // Estados y datos
  selectedMonth: string;
  showConfigModal: boolean;
  showCodesModal: boolean;
  showNoDataModal: boolean;
  modalTitle: string;
  modalMessage: string;
  filterTienda: string[];
  filterRol: Role | "all";
  filterFechaInicio: string;
  filterFechaFin: string;
  expandedTiendas: Set<string>;
  presupuestosEmpleados: any[];
  cargos: any[];
  
  // Datos computados
  availableMonths: string[];
  mesResumen: any;
  mesResumenFiltrado: any;
  uniqueTiendas: string[];
  staffValidationErrors: any[];
  state: any;
  
  // Handlers
  setSelectedMonth: (month: string) => void;
  setShowConfigModal: (show: boolean) => void;
  setShowCodesModal: (show: boolean) => void;
  setShowNoDataModal: (show: boolean) => void;
  setModalTitle: (title: string) => void;
  setModalMessage: (message: string) => void;
  setFilterTienda: (tiendas: string[]) => void;
  setFilterRol: (rol: Role | "all") => void;
  setFilterFechaInicio: (fecha: string) => void;
  setFilterFechaFin: (fecha: string) => void;
  setExpandedTiendas: (tiendas: Set<string>) => void;
  setVentas: (ventas: any[]) => void;
  
  // Funciones
  handleClearFilters: () => void;
  handleFilterTiendaChange: (value: string | string[]) => void;
  handleFilterRolChangeWrapper: (rol: string) => void;
  handleFilterRolChange: (rol: Role | "all" | "") => void;
  handleToggleAllStores: () => void;
  handleAssignmentComplete: () => void;
  onVentasUpdate: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>
  ) => void;
}

export function HomeView({
  selectedMonth,
  showConfigModal,
  showCodesModal,
  showNoDataModal,
  modalTitle,
  modalMessage,
  filterTienda,
  filterRol,
  filterFechaInicio,
  filterFechaFin,
  expandedTiendas,
  presupuestosEmpleados,
  cargos,
  availableMonths,
  mesResumen,
  mesResumenFiltrado,
  uniqueTiendas,
  staffValidationErrors,
  state,
  setSelectedMonth,
  setShowConfigModal,
  setShowCodesModal,
  setShowNoDataModal,
  setModalTitle,
  setModalMessage,
  setFilterTienda,
  setFilterRol,
  setFilterFechaInicio,
  setFilterFechaFin,
  setExpandedTiendas,
  setVentas,
  handleClearFilters,
  handleFilterTiendaChange,
  handleFilterRolChangeWrapper,
  handleFilterRolChange,
  handleToggleAllStores,
  handleAssignmentComplete,
  onVentasUpdate,
}: HomeViewProps) {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Paper
        elevation={10}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.paper",
          border: "2px solid",
          boxShadow: "0 1px 5px 0 ",
          borderColor: "primary.dark",
          borderRadius: 3,
          p: { xs: 1.5, sm: 2, md: 2.5 },
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Global
          styles={{
            "@keyframes pulse": {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.15)", color: "#5eb0b6ff" },
              "100%": { transform: "scale(1)" },
            },
          }}
        />
        
        {/* Content Container with wider layout,  */}
        <Box sx={{
          maxWidth: "95%",
          width: "100%",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Header */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
                Comisiones {selectedMonth}
              </Typography>

              {(filterTienda.length > 0 ||
                filterRol !== "all" ||
                filterFechaInicio ||
                filterFechaFin) && (
                  <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                    • Filtrado por:{" "}
                    {filterTienda.length > 0
                      ? `Tiendas: ${filterTienda.join(", ")}`
                      : ""}
                    {filterTienda.length > 0 &&
                      (filterRol !== "all" || filterFechaInicio || filterFechaFin)
                      ? " • "
                      : ""}
                    {filterRol !== "all" ? `Rol "${filterRol}"` : ""}
                    {filterRol !== "all" && (filterFechaInicio || filterFechaFin)
                      ? " • "
                      : ""}
                    {filterFechaInicio || filterFechaFin
                      ? `Fechas: ${filterFechaInicio || "..."} - ${filterFechaFin || "..."}`
                      : ""}
                  </Typography>
                )}
            </Box>

            {/* Botones de acción */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {(mesResumenFiltrado || mesResumen) && (
                <ExportButtons
                  mesResumen={mesResumenFiltrado || mesResumen}
                  mes={selectedMonth}
                />
              )}
            </Box>

            {/* Mobile Accordion Filters */}
            <MobileAccordionFilters
              selectedMonth={selectedMonth}
              availableMonths={availableMonths}
              onFilterRolChange={handleFilterRolChangeWrapper}
              onMonthChange={setSelectedMonth}
              filterTienda={filterTienda}
              onFilterTiendaChange={handleFilterTiendaChange}
              filterRol={filterRol}
              filterFechaInicio={filterFechaInicio}
              onFilterFechaInicioChange={setFilterFechaInicio}
              filterFechaFin={filterFechaFin}
              onFilterFechaFinChange={setFilterFechaFin}
              onClearFilters={handleClearFilters}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Alertas de Validación */}
              {staffValidationErrors.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: "warning.light", border: 1, borderColor: "warning.main" }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Warning sx={{ color: "warning.dark", flexShrink: 0 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="warning.dark" sx={{ mb: 1 }}>
                        Advertencias de Configuración
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {staffValidationErrors.map((error, index) => (
                          <Typography key={index} component="li" variant="body2" color="warning.dark">
                            • {error.message}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Resumen Ejecutivo */}
              <SummaryCards
                mesResumen={mesResumenFiltrado || mesResumen}
                onFilterRolChange={handleFilterRolChange}
                onToggleAllStores={handleToggleAllStores}
                currentFilterRol={filterRol}
                expandedTiendas={expandedTiendas}
              />

              {/* Tabla de Datos */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Detalle de Comisiones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Empleados: {state.staff.length} | Tiendas: {uniqueTiendas.length}
                  </Typography>
                </Box>
                <DataTable
                  tiendas={(mesResumenFiltrado || mesResumen)?.tiendas || []}
                  cargos={cargos}
                  selectedMonth={selectedMonth}
                  onVentasUpdate={onVentasUpdate}
                  readOnly={true}
                  expandedTiendas={expandedTiendas}
                  filterRol={filterRol}
                />
              </Box>

              {/* Gráficos */}
              {(mesResumenFiltrado || mesResumen) && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Análisis Visual
                  </Typography>
                  <Charts mesResumen={mesResumenFiltrado || mesResumen} />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Configuration Modal */}
      <Dialog
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Configuración de Comisiones</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Configure los presupuestos y parámetros de comisiones para el mes
            seleccionado.
          </DialogContentText>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Panel de Configuración */}
            {state.budgets.length > 0 && (
              <Box sx={{ p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                  Configuración Avanzada
                </Typography>
                <ConfigurationPanel mes={selectedMonth} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Codes Modal */}
      <CodesModal
        isOpen={showCodesModal}
        onClose={() => setShowCodesModal(false)}
        selectedMonth={selectedMonth}
        onAssignmentComplete={(ventasData) => {
          handleAssignmentComplete();
          setShowCodesModal(false);
        }}
      />

      {/* No Data Modal */}
      <NoDataModal
        open={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        tiendaNombre="todas las tiendas"
        mesSeleccionado={selectedMonth}
        title={modalTitle}
        message={modalMessage}
      />
    </Box>
  );
}