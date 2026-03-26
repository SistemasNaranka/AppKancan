import React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useContractContext } from "../contexts/ContractContext";
import { formatDate, daysUntil, getContractStatus } from "../lib/utils";
import { ContractStatusChip } from "./StatusChip";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarColor = (id: number | string) => {
  const colors = ["#004680", "#0070c0", "#1a7a4a", "#7b3f00", "#37474f"];
  const idx = String(id).charCodeAt(String(id).length - 1) % colors.length;
  return colors[idx];
};

// ─────────────────────────────────────────────────────────────────────────────
// ContractTable
// ─────────────────────────────────────────────────────────────────────────────

const ContractTable: React.FC = () => {
  const { filteredContratos, filters, setFilter, select } =
    useContractContext();

  return (
    <Card>
      {/* Toolbar */}
      <Box
        sx={{
          px: 2.5,
          py: 1.8,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          Todos los Contratos
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 1, color: "text.secondary" }}
          >
            ({filteredContratos.length} registros)
          </Typography>
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <SortOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={filters.sortBy}
              onChange={(e) =>
                setFilter({ sortBy: e.target.value as typeof filters.sortBy })
              }
              sx={{ fontSize: "0.82rem", bgcolor: "background.default" }}
            >
              <MenuItem value="vencimiento">Por vencimiento</MenuItem>
              <MenuItem value="nombre">Por nombre</MenuItem>
              <MenuItem value="fecha_ingreso">Por fecha de ingreso</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Tipo Contrato</TableCell>
              <TableCell>Fecha Ingreso</TableCell>
              <TableCell>Fecha Final</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredContratos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 6, color: "text.secondary", fontSize: "0.85rem" }}
                >
                  No se encontraron contratos con los filtros actuales.
                </TableCell>
              </TableRow>
            )}

            {filteredContratos.map((c) => {
              const daysLeft = daysUntil(c.fecha_final);
              const status = getContractStatus(c.fecha_final);

              return (
                <TableRow key={c.id} onClick={() => select(c.id)}>
                  {/* Empleado */}
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: avatarColor(c.id),
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          borderRadius: 2,
                        }}
                      >
                        {initials(c.nombre)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="text.primary"
                        >
                          {c.nombre} {c.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          #{c.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Cargo */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8rem", lineHeight: 1.4 }}
                    >
                      {c.cargo}
                    </Typography>
                  </TableCell>

                  {/* Tipo Contrato */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {c.tipo_contrato}
                    </Typography>
                  </TableCell>

                  {/* Fecha Ingreso */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.82rem" }}
                    >
                      {formatDate(c.fecha_ingreso)}
                    </Typography>
                  </TableCell>

                  {/* Fecha Final */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                      sx={{ fontSize: "0.82rem" }}
                    >
                      {formatDate(c.fecha_final)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          daysLeft < 0
                            ? "error.main"
                            : daysLeft <= 20
                              ? "error.main"
                              : daysLeft <= 50
                                ? "warning.main"
                                : "text.secondary",
                        fontWeight: daysLeft <= 50 ? 700 : 400,
                      }}
                    >
                      {daysLeft < 0 ? "Vencido" : `${daysLeft} días restantes`}
                    </Typography>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <ContractStatusChip status={status} />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={
                          <VisibilityOutlinedIcon
                            sx={{ fontSize: "14px !important" }}
                          />
                        }
                        onClick={() => select(c.id)}
                        sx={{
                          fontSize: "0.72rem",
                          px: 1.2,
                          py: 0.5,
                          borderColor: "divider",
                          color: "text.secondary",
                        }}
                      >
                        Ver
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default ContractTable;
