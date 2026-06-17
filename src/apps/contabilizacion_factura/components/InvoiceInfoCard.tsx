import {
  Box,
  Typography,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import CalendarToday from '@mui/icons-material/CalendarToday';
import EventBusy from '@mui/icons-material/EventBusy';
import Store from '@mui/icons-material/Store';
import Description from '@mui/icons-material/Description';
import Receipt from '@mui/icons-material/Receipt';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Fingerprint from '@mui/icons-material/Fingerprint';
import LocalShipping from '@mui/icons-material/LocalShipping';
import { DatosFacturaPDF, formatCurrency, formatDate, getNitSinDv } from "../types";

interface InvoiceInfoCardProps {
  datosFactura: DatosFacturaPDF;
  className?: string;
  entradas?: any[];
  entradaSeleccionada?: string;
  onSelectEntradaClick?: () => void;
}

interface MiniCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltipTitle?: string;
}

function MiniCard({
  label,
  value,
  icon,
  onClick,
  disabled,
  tooltipTitle,
}: MiniCardProps) {
  const cardContent = (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        backgroundColor: disabled ? "#f1f5f9" : "#f8fafc",
        border: disabled ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
        borderRadius: "8px",
        px: 2,
        py: 1,
        minWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "170px" },
        cursor: disabled ? "not-allowed" : (onClick ? "pointer" : "default"),
        transition: "all 0.2s ease",
        "&:hover": {
          transform: (onClick && !disabled) ? "translateY(-1px)" : "none",
          boxShadow: (onClick && !disabled) ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "none",
          borderColor: disabled ? "#cbd5e1" : ((onClick && !disabled) ? "#004680" : "#e2e8f0"),
        },
      }}
    >
      {icon && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: disabled ? "#94a3b8" : "#004680",
            backgroundColor: "transparent",
            borderRadius: "50%",
            p: 0.5,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: disabled ? "#94a3b8" : "#64748b",
            fontWeight: 700,
            display: "block",
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: disabled ? "#94a3b8" : "#1e293b",
            fontWeight: 800,
            fontSize: "0.9rem",
            lineHeight: 1.3,
            mt: 0.25,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Box sx={{ display: "inline-block", minWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "170px" } }}>
          {cardContent}
        </Box>
      </Tooltip>
    );
  }

  return cardContent;
}

export function InvoiceInfoCard({
  datosFactura,
  className,
  entradas = [],
  entradaSeleccionada = "",
  onSelectEntradaClick,
}: InvoiceInfoCardProps) {
  return (
    <Card
      className={className}
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid #e8eaed",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* ── Cabecera: Factura | Fecha ── PDF filename ── */}
      <Box
        sx={{
          display: "flex",
          backgroundColor: "#E8F0FE",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.75,
          borderBottom: "1px solid #e8eaed",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
          <CalendarToday sx={{ fontSize: 15, color: "#888", mr: 0.75 }} />
          <Typography variant="body2" sx={{ color: "#555" }}>
            <strong> FECHA EMISIÓN: </strong>
            {formatDate(datosFactura.fechaEmision)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
          <EventBusy sx={{ fontSize: 15, color: "#888", mr: 0.75 }} />
          <Typography variant="body2" sx={{ color: "#555" }}>
            <strong> FECHA VENCIMIENTO: </strong>{" "}
            {formatDate(datosFactura.fechaVencimiento)}
          </Typography>
        </Box>

        {datosFactura.archivo?.nombre && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Description sx={{ fontSize: 15, color: "#888" }} />
            <Typography
              variant="body2"
              sx={{
                color: "#666",
                fontSize: "0.8rem",
                fontFamily: "monospace",
              }}
            >
              {datosFactura.archivo.nombre}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Sección proveedor ── */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #e8eaed" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Ícono empresa */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "#e8f0fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Store sx={{ fontSize: 24, color: "#004680" }} />
          </Box>

          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "#888",
                fontSize: "0.65rem",
                letterSpacing: 1.2,
                lineHeight: 1.2,
                display: "block",
              }}
            >
              Proveedor
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.3,
                fontSize: "1.15rem",
              }}
            >
              {datosFactura.proveedor.nombre}
            </Typography>
            {/* Tarjetas de Información Clave */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                mt: 2.25,
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {/* Card Factura Completa */}
              <MiniCard
                label="Factura con prefijo"
                value={datosFactura.numeroFactura || "Sin número"}
                icon={<Receipt sx={{ fontSize: 16 }} />}
              />

              {/* Card Factura Sin Prefijo */}
              {datosFactura.numeroSinPrefijo && datosFactura.numeroSinPrefijo !== datosFactura.numeroFactura && (
                <MiniCard
                  label="Factura sin prefijo"
                  value={datosFactura.numeroSinPrefijo}
                  icon={<CheckCircle sx={{ fontSize: 16 }} />}
                />
              )}

              {/* Card NIT Completo */}
              {datosFactura.proveedor.nif && (
                <>
                  <MiniCard
                    label="NIT"
                    value={datosFactura.proveedor.nif}
                    icon={<Fingerprint sx={{ fontSize: 16 }} />}
                  />

                  {/* Card NIT Sin DV */}
                  {getNitSinDv(datosFactura.proveedor.nif) !== datosFactura.proveedor.nif && (
                    <MiniCard
                      label="NIT sin DV"
                      value={getNitSinDv(datosFactura.proveedor.nif)}
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                    />
                  )}
                </>
              )}

              {/* Card Código Automático */}
              {datosFactura.automaticoAsignado && (
                <MiniCard
                  label="Código Auto"
                  value={datosFactura.automaticoAsignado}
                  icon={<CheckCircle sx={{ fontSize: 16 }} />}
                />
              )}

              {/* Card Entrada Única */}
              {entradas && entradas.length === 1 && (
                <MiniCard
                  label="Número de entrada"
                  value={entradas[0].document_number}
                  icon={<LocalShipping sx={{ fontSize: 16 }} />}
                />
              )}

              {/* Card Entrada Seleccionada de múltiples */}
              {entradas && entradas.length > 1 && (datosFactura.entrada || entradaSeleccionada) && (
                <MiniCard
                  label="Número de entrada"
                  value={datosFactura.entrada || entradaSeleccionada}
                  icon={<LocalShipping sx={{ fontSize: 16 }} />}
                  onClick={onSelectEntradaClick}
                />
              )}

              {/* Card Entrada Sin Seleccionar de múltiples */}
              {entradas && entradas.length > 1 && !(datosFactura.entrada || entradaSeleccionada) && (
                <MiniCard
                  label="Número de entrada"
                  value="Seleccionar entrada..."
                  icon={<LocalShipping sx={{ fontSize: 16 }} />}
                  onClick={onSelectEntradaClick}
                />
              )}

              {/* Card Entrada si no hay entradas */}
              {(!entradas || entradas.length === 0) && (
                <MiniCard
                  label="Número de entrada"
                  value="Sin entradas vinculadas"
                  icon={<LocalShipping sx={{ fontSize: 16 }} />}
                  disabled={true}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Conceptos (si existen) ── */}
      {datosFactura.conceptos.length > 0 && (
        <Box sx={{ borderBottom: "1px solid #e8eaed" }}>
          <Box
            sx={{
              px: 3,
              py: 1.5,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Receipt sx={{ fontSize: 16, color: "#004680" }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#1a1a1a" }}
            >
              Conceptos
            </Typography>
            <Chip
              label={`${datosFactura.conceptos.length} items`}
              size="small"
              sx={{
                ml: "auto",
                backgroundColor: "#f0f4f8",
                color: "#004680",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 22,
              }}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#fafafa" }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#888",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      py: 1.25,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    Descripción
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: "#888",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      py: 1.25,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    Cant.
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: "#888",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      py: 1.25,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    P. Unit.
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: "#888",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      py: 1.25,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    Importe
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFactura.conceptos.map((concepto, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}
                  >
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#1a1a1a" }}
                      >
                        {concepto.descripcion}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ color: "#555" }}>
                        {concepto.cantidad.toLocaleString("es-ES")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography variant="body2" sx={{ color: "#555" }}>
                        {formatCurrency(
                          concepto.precioUnitario,
                          datosFactura.moneda,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#1a1a1a" }}
                      >
                        {formatCurrency(concepto.importe, datosFactura.moneda)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ── Impuestos + Resumen ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {/* Desglose de impuestos */}
        <Box
          sx={{
            p: 3,
            borderRight: { md: "1px solid #e8eaed" },
            borderBottom: { xs: "1px solid #e8eaed", md: "none" },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}
          >
            Desglose de Impuestos
          </Typography>

          {datosFactura.impuestos.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {datosFactura.impuestos.map((impuesto, index) => (
                <Box
                  key={`base-${index}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.25,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Base imponible ({impuesto.tipo}%)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#1a1a1a" }}
                  >
                    {formatCurrency(impuesto.base, datosFactura.moneda)}
                  </Typography>
                </Box>
              ))}
              {datosFactura.impuestos.map((impuesto, index) => (
                <Box
                  key={`iva-${index}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.25,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    IVA {impuesto.tipo}%
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#1a1a1a" }}
                  >
                    {formatCurrency(impuesto.importe, datosFactura.moneda)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "#aaa", fontStyle: "italic" }}
            >
              No se detectaron impuestos
            </Typography>
          )}
        </Box>

        {/* Resumen */}
        <Box sx={{ p: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}
          >
            Resumen
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.25,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#666" }}>
                Subtotal
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#1a1a1a" }}
              >
                {formatCurrency(datosFactura.subtotal, datosFactura.moneda)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.25,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#666" }}>
                Total Impuestos
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#1a1a1a" }}
              >
                {formatCurrency(
                  datosFactura.totalImpuestos,
                  datosFactura.moneda,
                )}
              </Typography>
            </Box>

            {/* TOTAL - fondo azul claro */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.5,
                px: 2,
                mt: 1.5,
                backgroundColor: "#e8f0fe",
                borderRadius: "10px",
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, color: "#1a1a1a" }}
              >
                TOTAL
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "#004680", fontSize: "1.25rem" }}
              >
                {formatCurrency(datosFactura.total, datosFactura.moneda)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
