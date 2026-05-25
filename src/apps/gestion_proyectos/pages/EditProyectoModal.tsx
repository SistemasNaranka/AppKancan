// src/apps/gestion_proyectos/pages/EditProyectoModal.tsx
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
import { updateProject } from "../api/directus/create";
import { updateProcess, deleteProcess, createProcess } from "../api/directus/create";
import type { CreateProjectInput, Project } from "../types";
import { EditModalOverlay, EditModalContent } from "./styles";
import { AREAS_PREDEFINIDAS, ICONOS_AREA } from "./utils";

interface EditProjectFormData {
  name: string;
  benefitedArea: string;
  description: string;
  assignees: string;
  startDate: string;
  estimatedDate: string;
  deliveryDate: string;
  status: string;
  projectType: string;
}

interface EditProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: Project | null;
  onSuccess: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function EditProjectModal({ open, onClose, proyecto, onSuccess, loading, setLoading }: EditProyectoModalProps) {
  const [formData, setFormData] = useState<EditProjectFormData>({
    name: "",
    benefitedArea: "",
    description: "",
    assignees: "",
    startDate: "",
    estimatedDate: "",
    deliveryDate: "",
    status: "en_proceso",
    projectType: "mejora",
  });

  const [processesEdit, setProcessesEdit] = useState<Array<{
    id: string;
    name: string;
    time_before: number;
    time_after: number;
    frequency_type: string;
    frequency_quantity: number;
    weekdays: number;
    isNew?: boolean;
  }>>([]);

  useEffect(() => {
    if (proyecto && open) {
      setFormData({
        name: proyecto.name,
        benefitedArea: proyecto.benefited_area,
        description: proyecto.description,
        assignees: proyecto.assignees?.map((e) => e.name).join(", ") || "",
        startDate: proyecto.start_date,
        estimatedDate: proyecto.estimated_date,
        deliveryDate: proyecto.delivery_date || "",
        status: proyecto.status,
        projectType: proyecto.project_type,
      });

      setProcessesEdit(
        (proyecto.processes || []).map((p) => ({
          id: p.id,
          name: p.name,
          time_before: Number(p.time_before),
          time_after: Number(p.time_after),
          frequency_type: p.frequency_type,
          frequency_quantity: p.frequency_quantity,
          weekdays: p.weekdays,
        }))
      );
    }
  }, [proyecto, open]);

  const handleChange = (field: keyof EditProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProcess = () => {
    setProcessesEdit([
      ...processesEdit,
      {
        id: `new_${Date.now()}`,
        name: "",
        time_before: 0,
        time_after: 0,
        frequency_type: "diaria",
        frequency_quantity: 1,
        weekdays: 5,
        isNew: true,
      },
    ]);
  };

  const handleRemoveProcess = async (index: number) => {
    const process = processesEdit[index];
    if (!process.isNew && process.id) {
      await deleteProcess(process.id);
    }
    setProcessesEdit(processesEdit.filter((_, i) => i !== index));
  };

  const handleUpdateProcess = (index: number, field: string, value: any) => {
    setProcessesEdit(
      processesEdit.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyecto) return;

    setLoading(true);
    try {
      let finalStatus = formData.status;

      if (formData.deliveryDate) {
        const deliveryDate = dayjs(formData.deliveryDate);
        const today = dayjs();
        const isPastOrToday = deliveryDate.isBefore(today) || deliveryDate.isSame(today, "day");
        const isFuture = deliveryDate.isAfter(today, "day");

        if (formData.status === "entregado" && isFuture) {
          finalStatus = "en_proceso";
        } else if (formData.status === "en_proceso" && isPastOrToday) {
          finalStatus = "entregado";
        }
      } else {
        if (formData.status === "entregado") {
          finalStatus = "en_proceso";
        }
      }

      const projectUpdateData: Partial<CreateProjectInput> = {
        name: formData.name,
        benefited_area: formData.benefitedArea,
        description: formData.description,
        start_date: formData.startDate,
        estimated_date: formData.estimatedDate,
        delivery_date: formData.deliveryDate || null,
        status: finalStatus as any,
        project_type: formData.projectType as any,
        assignees: formData.assignees
          .split(",")
          .map((n) => ({ name: n.trim() }))
          .filter((e) => e.name),
      };

      const success = await updateProject(proyecto.id, projectUpdateData);
      if (success) {
        for (const process of processesEdit) {
          if (process.isNew) {
            await createProcess({
              project_id: proyecto.id,
              name: process.name,
              time_before: process.time_before,
              time_after: process.time_after,
              frequency_type: process.frequency_type as any,
              frequency_quantity: process.frequency_quantity,
              weekdays: process.weekdays,
              order: processesEdit.indexOf(process) + 1,
            });
          } else {
            await updateProcess(process.id, {
              name: process.name,
              time_before: process.time_before,
              time_after: process.time_after,
              frequency_type: process.frequency_type as any,
              frequency_quantity: process.frequency_quantity,
              weekdays: process.weekdays,
              order: processesEdit.indexOf(process) + 1,
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
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              fullWidth
              size="medium"
            />

            <Autocomplete
              freeSolo
              options={AREAS_PREDEFINIDAS}
              value={formData.benefitedArea || ""}
              onChange={(_event, value) => handleChange("benefitedArea", value || "")}
              onInputChange={(_event, value, reason) => {
                if (reason === "input") {
                  handleChange("benefitedArea", value);
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
                value={formData.status}
                label="Estado"
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="entregado">Entregado</MenuItem>
                <MenuItem value="en_seguimiento">En Seguimiento</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="medium">
              <InputLabel>Tipo de Proyecto</InputLabel>
              <Select
                value={formData.projectType}
                label="Tipo de Proyecto"
                onChange={(e) => handleChange("projectType", e.target.value)}
              >
                <MenuItem value="actualizacion">Actualización</MenuItem>
                <MenuItem value="mejora">Mejora</MenuItem>
                <MenuItem value="nuevo">Nuevo Proyecto</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <DatePicker
                label="Fecha Inicio"
                value={formData.startDate ? dayjs(formData.startDate) : null}
                slotProps={{ textField: { fullWidth: true, required: true, size: "medium", disabled: true } }}
              />
              <DatePicker
                label="Fecha Estimada"
                value={formData.estimatedDate ? dayjs(formData.estimatedDate) : null}
                slotProps={{ textField: { fullWidth: true, required: true, size: "medium", disabled: true } }}
              />
              <DatePicker
                label="Fecha Entrega"
                value={formData.deliveryDate ? dayjs(formData.deliveryDate) : null}
                onChange={(newValue) => handleChange("deliveryDate", newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                slotProps={{ textField: { fullWidth: true, size: "medium" } }}
              />
            </Box>

            <TextField
              label="Encargados (separados por coma)"
              value={formData.assignees}
              onChange={(e) => handleChange("assignees", e.target.value)}
              fullWidth
              size="medium"
              placeholder="Nombre1, Nombre2, ..."
            />

            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
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
                  onClick={handleAddProcess}
                  sx={{ textTransform: "none" }}
                >
                  Agregar Proceso
                </Button>
              </Box>

              {processesEdit.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 300, overflow: "auto" }}>
                  {processesEdit.map((process, index) => (
                    <Paper
                      key={process.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2 }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          Proceso {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveProcess(index)}
                          sx={{ color: "error.main" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <TextField
                          label="Nombre"
                          value={process.name}
                          onChange={(e) => handleUpdateProcess(index, "name", e.target.value)}
                          size="small"
                          sx={{ flex: 1, minWidth: 150 }}
                        />
                        <TextField
                          label="Tiempo antes (seg)"
                          type="number"
                          value={process.time_before}
                          onChange={(e) => handleUpdateProcess(index, "time_before", Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <TextField
                          label="Tiempo después (seg)"
                          type="number"
                          value={process.time_after}
                          onChange={(e) => handleUpdateProcess(index, "time_after", Number(e.target.value))}
                          size="small"
                          sx={{ width: 120 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <InputLabel>Frecuencia</InputLabel>
                          <Select
                            value={process.frequency_type}
                            label="Frecuencia"
                            onChange={(e) => handleUpdateProcess(index, "frequency_type", e.target.value)}
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