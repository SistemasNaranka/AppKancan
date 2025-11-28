import React, { useRef, useState } from "react";
import Papa from "papaparse";
import {
  Button,
  Card,
  CardContent,
  Alert,
  Typography,
  Box,
} from "@mui/material";
import { Error, CheckCircle, Upload as UploadIcon } from "@mui/icons-material";
import { useCommission } from "../contexts/CommissionContext";
import { validateBudgetRecord } from "../lib/validation";
import { BudgetRecord } from "../types";

export const CSVUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { setBudgets } = useCommission();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    Papa.parse(
      file as any,
      {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          const errors: string[] = [];
          const budgets: BudgetRecord[] = [];

          results.data.forEach((row: any, index: number) => {
            const validationErrors = validateBudgetRecord(row, index + 2);
            if (validationErrors.length > 0) {
              validationErrors.forEach((err) => {
                errors.push(`Fila ${err.row}: ${err.field} - ${err.message}`);
              });
            } else {
              budgets.push({
                tienda: row.tienda.trim(),
                fecha: row.fecha.trim(),
                presupuesto_total: parseFloat(row.presupuesto_total),
              });
            }
          });

          if (errors.length > 0) {
            setMessage({
              type: "error",
              text: `Errores en el CSV:\n${errors.slice(0, 5).join("\n")}${
                errors.length > 5
                  ? `\n... y ${errors.length - 5} errores más`
                  : ""
              }`,
            });
          } else if (budgets.length === 0) {
            setMessage({
              type: "error",
              text: "No se encontraron registros válidos en el CSV",
            });
          } else {
            setBudgets(budgets);
            setMessage({
              type: "success",
              text: `Se cargaron ${budgets.length} registros de presupuesto correctamente`,
            });
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }

          setLoading(false);
        },
      } as any
    );
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: "none" }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="outlined"
              startIcon={<UploadIcon />}
            >
              {loading ? "Cargando..." : "Cargar CSV de Presupuestos"}
            </Button>
          </Box>

          {message && (
            <Alert
              severity={message.type === "success" ? "success" : "error"}
              icon={message.type === "success" ? <CheckCircle /> : <Error />}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {message.text}
              </Typography>
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              bgcolor: "info.main",
              color: "info.contrastText",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "info.light",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Formato esperado del CSV:
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
              tienda,fecha,presupuesto_total
            </Typography>
            <br />
            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
              Tienda A,2025-11-01,50000
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
