import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ContractStatusChip } from "./StatusChip";
import { useContractContext } from "../contexts/ContractContext";
import { daysUntil, formatDate, getContractStatus } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ContractDetail
// ─────────────────────────────────────────────────────────────────────────────

const ContractDetail: React.FC = () => {
  const { selectedContrato, select } = useContractContext();

  if (!selectedContrato) return null;

  const c = selectedContrato;
  const daysLeft = daysUntil(c.fecha_final);
  const contractStatus = getContractStatus(c.fecha_final);

  return (
    <Box>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => select(null)}
          sx={{
            borderColor: "divider",
            color: "text.secondary",
            fontSize: "0.78rem",
          }}
        >
          Volver
        </Button>
        <Typography variant="caption" color="text.disabled">
          Contratos
        </Typography>
        <Typography variant="caption" color="text.disabled">
          ›
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Expediente del Empleado
        </Typography>
      </Stack>

      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "flex-start" }}
        mb={3}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {c.nombre} {c.apellido}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BadgeOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {c.cargo} · {c.tipo_contrato} · ID: #{c.id}
            </Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5} flexShrink={0}>
          <Button
            variant="outlined"
            sx={{
              borderColor: "divider",
              color: "text.secondary",
              fontSize: "0.8rem",
            }}
          >
            Descargar PDF
          </Button>
        </Stack>
      </Stack>

      {/* Body */}
      <Grid container spacing={2.5}>
        {/* Info card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2.5}
              >
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.3 }}>
                    Información del Contrato
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Detalles del registro contractual
                  </Typography>
                </Box>
                <ContractStatusChip status={contractStatus} />
              </Stack>

              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Documento
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {c.documento}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Tipo de Contrato
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {c.tipo_contrato}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha de Ingreso
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(c.fecha_ingreso)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha Final
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(c.fecha_final)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Duración
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {c.duracion}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Prórroga
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {String(c.prorroga)}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Side panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            {/* Summary card */}
            <Box
              sx={{
                background: "linear-gradient(160deg, #004680, #002d54)",
                borderRadius: 3,
                p: 2.5,
                color: "#fff",
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: "#7fb8e8", display: "block", mb: 1.5 }}
              >
                Resumen del Contrato
              </Typography>

              <Stack spacing={1.5}>
                <Box
                  sx={{
                    bgcolor: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <CalendarMonthOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: "rgba(255,255,255,0.5)",
                      mb: 0.5,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "1.4rem",
                      fontWeight: 900,
                      color: daysLeft < 0 ? "#ef5350" : "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {daysLeft < 0 ? "Vencido" : `${daysLeft} días`}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Días restantes
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                      Empleado
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: "#fff" }}
                    >
                      {c.nombre} {c.apellido}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                      Cargo
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: "#fff" }}
                    >
                      {c.cargo}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                      Estado
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        color:
                          contractStatus === "vigente"
                            ? "#81c784"
                            : contractStatus === "proximo"
                              ? "#ffb74d"
                              : "#ef5350",
                      }}
                    >
                      {contractStatus === "vigente"
                        ? "Vigente"
                        : contractStatus === "proximo"
                          ? "Próximo a Vencer"
                          : "Vencido"}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>

            {/* Alert note */}
            {daysLeft >= 0 && daysLeft <= 50 && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "warning.light",
                  border: "1.5px solid",
                  borderColor: "#ffcc80",
                  borderRadius: 3,
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                }}
              >
                <WarningAmberIcon
                  sx={{
                    fontSize: 18,
                    color: "warning.main",
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: "#7b3f00", display: "block", mb: 0.3 }}
                  >
                    Nota de Cumplimiento
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#8a5500", lineHeight: 1.6 }}
                  >
                    Este contrato está próximo al vencimiento. Revise las
                    opciones de renovación o prórroga disponibles.
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractDetail;
