import React from "react";
import { Box, Card, CardContent, Typography, Divider } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Resolucion } from "../types";
import StatusBadge from "./StatusBadge";
import Button from "./Button";
import { diasRestantes } from "../api/read";

interface ResolutionCardProps {
  resolucion: Resolucion | null;
  onIntegrar: () => void;
  onLimpiar: () => void;
  onSubirArchivo: (archivo: File) => void;
}

const ResolutionCard: React.FC<ResolutionCardProps> = ({
  resolucion,
  onIntegrar,
  onLimpiar,
  onSubirArchivo,
}) => {
  // Calcular días restantes si hay resolución
  const infoVencimiento =
    resolucion?.vigencia && resolucion?.fecha_creacion
      ? diasRestantes(resolucion.vigencia, resolucion.fecha_creacion)
      : null;

  // Función para formatear número de resolución (4-4-3-3)
  const formatearResolucion = (numero: string | undefined): string => {
    if (!numero) return "";
    const s = numero.toString();
    if (s.length !== 14) return s; // Si no tiene 14 dígitos, devolver sin formato
    return `${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 11)} ${s.slice(11, 14)}`;
  };

  const campos = [
    {
      etiqueta: "Resolución",
      valor: formatearResolucion(resolucion?.numero_formulario),
    },
    { etiqueta: "Razón social", valor: resolucion?.razon_social },
    { etiqueta: "Prefijo", valor: resolucion?.prefijo },
    { etiqueta: "Desde", valor: resolucion?.desde_numero },
    { etiqueta: "Hasta", valor: resolucion?.hasta_numero },
    {
      etiqueta: "Vigencia",
      valor: resolucion?.vigencia ? `${resolucion.vigencia} meses` : "",
    },
    { etiqueta: "Vencimiento", valor: infoVencimiento?.texto || "" },
    { etiqueta: "Tipo", valor: resolucion?.tipo_solicitud },
    { etiqueta: "Fecha", valor: resolucion?.fecha_creacion },
  ];

  return (
    <Box>
      <>
        <input
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          id="input-pdf"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) {
              onSubirArchivo(archivo);
            }
            e.target.value = "";
          }}
        />
        <label htmlFor="input-pdf">
          <Button
            texto="Subir archivo"
            onClick={() => document.getElementById("input-pdf")?.click()}
            variante="secundario"
            icono={<UploadFileIcon />}
          />
        </label>
      </>

      <Card sx={{ mt: 2, borderRadius: 3 }}>
        <CardContent>
          {resolucion ? (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                {campos.map((campo) => {
                  let colorTexto = "inherit";
                  if (campo.etiqueta === "Vencimiento" && infoVencimiento) {
                    if (infoVencimiento.dias < 10) {
                      colorTexto = "#d32f2f";
                    } else if (infoVencimiento.dias < 30) {
                      colorTexto = "#ed6c02";
                    } else {
                      colorTexto = "#2e7d32";
                    }
                  }

                  return (
                    <Box
                      key={campo.etiqueta}
                      sx={{
                        display: "flex",
                        mb: 1.5,
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          minWidth: 110,
                          flexShrink: 0,
                        }}
                      >
                        {campo.etiqueta}:
                      </Typography>
                      <Typography
                        sx={{
                          color: colorTexto,
                          fontWeight:
                            campo.etiqueta === "Vencimiento"
                              ? "bold"
                              : "normal",
                          wordBreak: "break-word",
                          flex: 1,
                        }}
                      >
                        {campo.valor}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ textAlign: "center" }}>
                <StatusBadge estado={resolucion.estado} mostrarTexto />
              </Box>
            </Box>
          ) : (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              Selecciona una resolución
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              texto="Integrar"
              onClick={onIntegrar}
              variante="primario"
              disabled={!resolucion}
            />
            <Button
              variante="peligro"
              texto="Limpiar"
              onClick={onLimpiar}
              disabled={!resolucion}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResolutionCard;
