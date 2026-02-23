/**
 * Componente para mostrar información de la factura extraída
 * Diseño limpio tipo tarjeta
 * Módulo de Contabilización de Facturas
 */

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
} from "@mui/material";
import {
  CalendarToday,
  EventBusy,
  Store,
  Description,
  Receipt,
} from "@mui/icons-material";
import { DatosFacturaPDF, formatCurrency, formatDate } from "../types";

interface InvoiceInfoCardProps {
  datosFactura: DatosFacturaPDF;
}

export function InvoiceInfoCard({ datosFactura }: InvoiceInfoCardProps) {
  return (
    <Card
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
            {/* Badges: Factura + NIF */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
                flexWrap: "wrap",
              }}
            >
              {/* Badge Factura */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#f0f4f8",
                  borderRadius: "6px",
                  px: 1.25,
                  py: 0.35,
                  border: "1px solid #e0e6ef",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#444", fontWeight: 600, fontSize: "0.75rem" }}
                >
                  Factura&nbsp;
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#004680",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                  }}
                >
                  {datosFactura.numeroFactura || "Sin número"}
                </Typography>
              </Box>

              {/* Badge NIF */}
              {datosFactura.proveedor.nif && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "#f0f4f8",
                    borderRadius: "6px",
                    px: 1.25,
                    py: 0.35,
                    border: "1px solid #e0e6ef",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#444", fontWeight: 600, fontSize: "0.75rem" }}
                  >
                    NIT&nbsp;
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#1a1a1a",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  >
                    {datosFactura.proveedor.nif}
                  </Typography>
                </Box>
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
