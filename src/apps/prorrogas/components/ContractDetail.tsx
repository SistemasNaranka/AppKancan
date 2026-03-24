import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ContractStatusChip, RequestStatusChip } from "./StatusChip";
import ContractTimeline from "./ContractTimeline";
import { useContractContext } from "../contexts/contractcontext";
import { daysUntil, formatDate, getContractStatus } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ContractDetail
// ─────────────────────────────────────────────────────────────────────────────

const docIcon = (tipo: string) => {
  if (tipo === "contrato")
    return (
      <AssignmentOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
    );
  if (tipo === "evaluacion")
    return (
      <BarChartOutlinedIcon sx={{ fontSize: 18, color: "success.main" }} />
    );
  if (tipo === "otrosi")
    return (
      <ArticleOutlinedIcon sx={{ fontSize: 18, color: "secondary.main" }} />
    );
  return (
    <DescriptionOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
  );
};

interface Props {
  onOpenForm: () => void;
}

const ContractDetail: React.FC<Props> = ({ onOpenForm }) => {
  const { selectedContrato, select } = useContractContext();

  if (!selectedContrato) return null;

  const c = selectedContrato;
  const lastProrroga = c.prorrogas[c.prorrogas.length - 1];
  const daysLeft = daysUntil(lastProrroga.fecha_fin);
  const contractStatus = getContractStatus(lastProrroga.fecha_fin);

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
            {c.empleado_nombre}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BadgeOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {c.empleado_cargo} · {c.empleado_departamento} · ID: #{c.id}
            </Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5} flexShrink={0}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{
              borderColor: "divider",
              color: "text.secondary",
              fontSize: "0.8rem",
            }}
          >
            Expediente PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={onOpenForm}
            sx={{ fontSize: "0.8rem" }}
          >
            Extender Contrato
          </Button>
        </Stack>
      </Stack>

      {/* Body */}
      <Grid container spacing={2.5}>
        {/* Timeline card */}
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
                    Estado de Evolución Contractual
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Registro cronológico de prórrogas y renovaciones
                  </Typography>
                </Box>
                <ContractStatusChip status={contractStatus} />
              </Stack>
              <ContractTimeline prorrogas={c.prorrogas} />
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
                sx={{ color: "#7fb8e8", display: "block", mb: 1 }}
              >
                Resumen del Contrato
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  {
                    label: "Prórrogas Totales",
                    value: c.prorrogas.length.toString(),
                    Icon: AssignmentOutlinedIcon,
                  },
                  {
                    label: "Días Restantes",
                    value: daysLeft < 0 ? "Vencido" : `${daysLeft}`,
                    Icon: CalendarMonthOutlinedIcon,
                    warn: daysLeft <= 50,
                  },
                ].map((item) => (
                  <Grid size={6} key={item.label}>
                    <Box
                      sx={{
                        bgcolor: "rgba(255,255,255,0.08)",
                        borderRadius: 2,
                        p: 1.5,
                      }}
                    >
                      <item.Icon
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
                          color: item.warn ? "#ffb74d" : "#fff",
                          lineHeight: 1,
                        }}
                      >
                        {item.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                    Tipo de Contrato
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: "#fff" }}
                  >
                    {lastProrroga.numero >= 4
                      ? "Fijo Indefinido"
                      : "Fijo < 1 año"}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                    Prórroga Actual
                  </Typography>
                  <Chip
                    label={`N.° ${lastProrroga.numero}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      height: 18,
                    }}
                  />
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                    Estado Solicitud
                  </Typography>
                  <RequestStatusChip
                    status={c.request_status}
                    sx={{ height: 20, fontSize: "0.65rem" }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: "#a0c8e8" }}>
                    Vencimiento
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: "#fff" }}
                  >
                    {formatDate(lastProrroga.fecha_fin)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Documents */}
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Documentación Clave
                </Typography>
                <List dense disablePadding>
                  {c.documentos.map((doc, idx) => (
                    <React.Fragment key={doc.id}>
                      <ListItem
                        sx={{ px: 0, py: 1 }}
                        secondaryAction={
                          <Button
                            size="small"
                            sx={{
                              minWidth: "auto",
                              p: 0.5,
                              color: "primary.main",
                            }}
                          >
                            <OpenInNewOutlinedIcon sx={{ fontSize: 15 }} />
                          </Button>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {docIcon(doc.tipo)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="caption" fontWeight={600}>
                              {doc.nombre}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.disabled">
                              {doc.firmado ? "Firmado" : "Sin firma"} ·{" "}
                              {formatDate(doc.fecha)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {idx < c.documentos.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                <Button
                  fullWidth
                  size="small"
                  sx={{
                    mt: 1,
                    color: "primary.main",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  Ver todo el archivo
                </Button>
              </CardContent>
            </Card>

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
                    Este empleado está próximo al vencimiento. Revise la
                    normativa v1.0 de Prórrogas.
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
