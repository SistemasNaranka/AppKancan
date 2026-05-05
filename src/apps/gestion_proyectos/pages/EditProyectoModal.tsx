import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Autocomplete,
  Paper,
} from "@mui/material";
import { Business as BusinessIcon, Close, Save, Add, Delete } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { updateProyecto } from "../api/directus/create";
import { updateProceso, deleteProceso, createProceso } from "../api/directus/create";
import type { CreateProyectoInput } from "../types";
import { EditModalOverlay, EditModalContent } from "./styles";
import { AREAS_PREDEFINIDAS, ICONOS_AREA } from "./utils";

interface EditProjectFormData {
  nombre: string;
  areaBeneficiada: string;
  descripcion: string;
  encargado: string;
  fechaInicio: string;
  fechaEstimada: string;
  fechaEntrega: string;
  estado: string;
  tipoProyecto: string;
}

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: import("../types").Proyecto | null;
  onSuccess: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function EditProyectoModal({ open, onClose, proyecto, onSuccess, loading, setLoading }: EditProyectoModalProps) {
  const [formData, setFormData] = useState<EditProjectFormData>({
    nombre: "",
    areaBeneficiada: "",
    descripcion: "",
    encargado: "",
    fechaInicio: "",
    fechaEstimada: "",
    fechaEntrega: "",
    estado: "en_proceso",
    tipoProyecto: "mejora",
  });

  const [procesosEdit, setProcesosEdit] = useState<Array<{
    id: string;
    nombre: string;
    tiempo_antes: number;
    tiempo_despues: number;
    frecuencia_tipo: string;
    frecuencia_cantidad: number;
    dias_semana: number;
    isNew?: boolean;
  }>>([]);

  useEffect(() => {
    if (proyecto && open) {
      setFormData({
        nombre: proyecto.nombre,
        areaBeneficiada: proyecto.area_beneficiada,
        descripcion: proyecto.descripcion,
        encargado: proyecto.encargados?.map((e) => e.nombre).join(", ") || "",
        fechaInicio: proyecto.fecha_inicio,
        fechaEstimada: proyecto.fecha_estimada,
        fechaEntrega: proyecto.fecha_entrega || "",
        estado: proyecto.estado,
        tipoProyecto: proyecto.tipo_proyecto,
      });

      setProcesosEdit(
        (proyecto.procesos || []).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          tiempo_antes: p.tiempo_antes,
          tiempo_despues: p.tiempo_despues,
          frecuencia_tipo: p.frecuencia_tipo,
          frecuencia_cantidad: p.frecuencia_cantidad,
          dias_semana: p.dias_semana,
        }))
      );
    }
  }, [proyecto, open]);

  const handleChange = (field: keyof EditProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgregarProceso = () => {
    setProcesosEdit([
      ...procesosEdit,
      {
        id: `new_${Date.now()}`,
        nombre: "",
        tiempo_antes: 0,
        tiempo_despues: 0,
        frecuencia_tipo: "diaria",
        frecuencia_cantidad: 1,
        dias_semana: 5,
        isNew: true,
      },
    ]);
  };

  const handleEliminarProceso = async (index: number) => {
    const proceso = procesosEdit[index];
    if (!proceso.isNew && proceso.id) {
      await deleteProceso(proceso.id);
    }
    setProcesosEdit(procesosEdit.filter((_, i) => i !== index));
  };

  const handleActualizarProceso = (index: number, field: string, value: any) => {
    setProcesosEdit(
      procesosEdit.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyecto) return;

    setLoading(true);
    try {
      let nuevoEstado = formData.estado;

      if (formData.fechaEntrega) {
        const fechaEntrega = dayjs(formData.fechaEntrega);
        const hoy = dayjs();
        const esFechaPasadaOActual = fechaEntrega.isBefore(hoy) || fechaEntrega.isSame(hoy, "day");
        const esFechaFutura = fechaEntrega.isAfter(hoy, "day");

        if (formData.estado === "entregado" && esFechaFutura) {
          nuevoEstado = "en_proceso";
        } else if (formData.estado === "en_proceso" && esFechaPasadaOActual) {
          nuevoEstado = "entregado";
        }
      } else {
        if (formData.estado === "entregado") {
          nuevoEstado = "en_proceso";
        }
      }

      const proyectoData: Partial<CreateProyectoInput> = {
        nombre: formData.nombre,
        area_beneficiada: formData.areaBeneficiada,
        descripcion: formData.descripcion,
        fecha_inicio: formData.fechaInicio,
        fecha_estimada: formData.fechaEstimada,
        fecha_entrega: formData.fechaEntrega || null,
        estado: nuevoEstado as any,
        tipo_proyecto: formData.tipoProyecto as any,
        encargados: formData.encargado
          .split(",")
          .map((n) => ({ nombre: n.trim() }))
          .filter((e) => e.nombre),
      };

      const success = await updateProyecto(proyecto.id, proyectoData);
      if (success) {
        for (const proceso of procesosEdit) {
          if (proceso.isNew) {
            await createProceso({
              proyecto_id: proyecto.id,
              nombre: proceso.nombre,
              tiempo_antes: proceso.tiempo_antes,
              tiempo_despues: proceso.tiempo_despues,
              frecuencia_tipo: proceso.frecuencia_tipo as any,
              frecuencia_cantidad: proceso.frecuencia_cantidad,
              dias_semana: proceso.dias_semana,
              orden: procesosEdit.indexOf(proceso) + 1,
            });
          } else {
            await updateProceso(proceso.id, {
              nombre: proceso.nombre,
              tiempo_antes: proceso.tiempo_antes,
              tiempo_despues: proceso.tiempo_despues,
              frecuencia_tipo: proceso.frecuencia_tipo as any,
              frecuencia_cantidad: proceso.frecuencia_cantidad,
              dias_semana: proceso.dias_semana,
              orden: procesosEdit.indexOf(proceso) + 1,
            });
          }
        }
        onSuccess();
      } else {
        console.error("Error al actualizar el proyecto");
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <EditModalOverlay onClick={onClose}>
        <EditModalContent onClick={(e) => e.stopPropagation()} elevation={8}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#1a2b45" }}>
              Editar Proyecto
            </Typography>
            <IconButton onClick={onClose} aria-label="Cerrar modal" size="small">
              <Close />
            </IconButton>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Nombre del Proyecto"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              required
              fullWidth
              size="medium"
            />

            <Autocomplete
              freeSolo
              options={AREAS_PREDEFINIDAS}
              value={formData.areaBeneficiada || ""}
              onChange={(_event, value) => handleChange("areaBeneficiada", value || "")}
              onInputChange={(_event, value, reason) => {
                if (reason === "input") {
                  handleChange("areaBeneficiada", value);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Área Beneficiada"
                  required
                  fullWidth
                  size="medium"
                  placeholder="Selecciona o escribe un área"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props;
                const Icono = ICONOS_AREA[option] || BusinessIcon;
                return (
                  <Box component="li" key={key} {...restProps} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Icono sx={{ fontSize: 18, color: "text.secondary" }} />
                    {option}
                  </Box>
                );
              }}
            />

            <FormControl fullWidth size="medium">
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={(e) => handleChange("estado", e.target.value)}
              >
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="entregado">Entregado</MenuItem>
                <MenuItem value="en_seguimiento">En Seguimiento</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="medium">
              <InputLabel>Tipo de Proyecto</InputLabel>
              <Select
                value={formData.tipoProyecto}
                label="Tipo de Proyecto"
                onChange={(e) => handleChange("tipoProyecto", e.target.value)}
              >
                <MenuItem value="actualizacion">Actualizacón</MenuItem>
                <MenuItem value="proyecto_nuevo">Proyecto Nuevo</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <DatePicker
                label="Fecha Inicio"
                value={formData.fechaInicio ? dayjs(formData.fechaInicio) : null}
                slotProps={{ textField: { fullWidth: true, required: true, size: "medium", disabled: true } }}
              />
              <DatePicker
                label="Fecha Estimada"
                value={formData.fechaEstimada ? dayjs(formData.fechaEstimada) : null}
                slotProps={{ textField: { fullWidth: true, required: true, size: "medium", disabled: true } }}
              />
              <DatePicker
                label="Fecha Entrega"
                value={formData.fechaEntrega ? dayjs(formData.fechaEntrega) : null}
                onChange={(newValue) => handleChange("fechaEntrega", newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                slotProps={{ textField: { fullWidth: true, size: "medium" } }}
              />
            </Box>

            <TextField
              label="Encargados (separados por coma)"
              value={formData.encargado}
              onChange={(e) => handleChange("encargado", e.target.value)}
              fullWidth
              size="medium"
              placeholder="Nombre1, Nombre2, ..."
            />

            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              fullWidth
              size="medium"
              multiline
              rows={3}
            />

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a2b45" }}>
                  Procesos del Proyecto
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={handleAgregarProceso}
                  sx={{ textTransform: "none" }}
                >
                  Agregar Proceso
                </Button>
              </Box>

              {procesosEdit.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 300, overflow: "auto" }}>
                  {procesosEdit.map((proceso, index) => (
                    <Paper
                      key={proceso.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2 }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          Proceso {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleEliminarProceso(index)}
                          sx={{ color: "error.main" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <TextField
                          label="Nombre"
                          value={proceso.nombre}
                          onChange={(e) => handleActualizarProceso(index, "nombre", e.target.value)}
                          size="small"
                          sx={{ flex: 1, minWidth: 150 }}
                        />
                        <TextField
                          label="Tiempo antes (seg)"
                          type="number"
                          value={proceso.tiempo_antes}
                          onChange={(e) => handleActualizarProceso(index, "tiempo_antes", Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <TextField
                          label="Tiempo después (seg)"
                          type="number"
                          value={proceso.tiempo_despues}
                          onChange={(e) => handleActualizarProceso(index, "tiempo_despues", Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <InputLabel>Frecuencia</InputLabel>
                          <Select
                            value={proceso.frecuencia_tipo}
                            label="Frecuencia"
                            onChange={(e) => handleActualizarProceso(index, "frecuencia_tipo", e.target.value)}
                          >
                            <MenuItem value="diaria">Diaria</MenuItem>
                            <MenuItem value="semanal">Semanal</MenuItem>
                            <MenuItem value="mensual">Mensual</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                  No hay procesos. Agrega uno nuevo.
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                startIcon={<Close />}
                sx={{ borderColor: "#ddd", color: "#5A6A7E" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? undefined : <Save />}
                sx={{
                  backgroundColor: "#004680",
                  "&:hover": { backgroundColor: "#005AA3" },
                }}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </Box>
          </Box>
        </EditModalContent>
      </EditModalOverlay>
    </LocalizationProvider>
  );
}