import { Contrato } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — reemplazar con llamadas reales a la API
// Usa los tipos Directus: snake_case, ids numéricos
// ─────────────────────────────────────────────────────────────────────────────

export const mockContratos: Contrato[] = [
  // ── VIGENTE ──────────────────────────────────────────────────────────────
  {
    id: 1,
    empleado_nombre: 'Juan Pérez',
    empleado_cargo: 'Analista de Ciberseguridad Senior',
    empleado_departamento: 'Tecnología',
    request_status: 'en_revision',
    documentos: [
      { id: 1, contrato_id: 1, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2023-01-15', firmado: true },
      { id: 2, contrato_id: 1, nombre: 'Evaluación Desempeño Q3', tipo: 'evaluacion', fecha: '2023-10-01', firmado: false },
      { id: 3, contrato_id: 1, nombre: 'Otrosí Prórroga 1', tipo: 'otrosi', fecha: '2023-05-16', firmado: true },
    ],
    prorrogas: [
      { id: 1, contrato_id: 1, numero: 0, label: 'Contrato Inicial', descripcion: 'Período de prueba y formación inicial.', fecha_inicio: '2023-01-15', fecha_fin: '2023-05-15', duracion_meses: 4 },
      { id: 2, contrato_id: 1, numero: 1, label: 'Prórroga 1', descripcion: 'Consolidación de objetivos técnicos.', fecha_inicio: '2023-05-16', fecha_fin: '2023-09-16', duracion_meses: 4 },
      { id: 3, contrato_id: 1, numero: 2, label: 'Prórroga 2', descripcion: 'Tramo de alta responsabilidad.', fecha_inicio: '2023-09-17', fecha_fin: '2026-07-20', duracion_meses: 4 },
    ],
  },
  {
    id: 2,
    empleado_nombre: 'María González',
    empleado_cargo: 'Gerente de Proyectos',
    empleado_departamento: 'Dirección',
    request_status: 'aprobada',
    documentos: [
      { id: 4, contrato_id: 2, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2023-03-01', firmado: true },
      { id: 5, contrato_id: 2, nombre: 'Otrosí Prórroga 4', tipo: 'otrosi', fecha: '2024-07-05', firmado: true },
    ],
    prorrogas: [
      { id: 4, contrato_id: 2, numero: 0, label: 'Contrato Inicial', descripcion: 'Incorporación y onboarding.', fecha_inicio: '2023-03-01', fecha_fin: '2023-07-01', duracion_meses: 4 },
      { id: 5, contrato_id: 2, numero: 1, label: 'Prórroga 1', descripcion: 'Gestión de portafolio Q3.', fecha_inicio: '2023-07-02', fecha_fin: '2023-11-02', duracion_meses: 4 },
      { id: 6, contrato_id: 2, numero: 2, label: 'Prórroga 2', descripcion: 'Liderazgo de transformación digital.', fecha_inicio: '2023-11-03', fecha_fin: '2024-03-03', duracion_meses: 4 },
      { id: 7, contrato_id: 2, numero: 3, label: 'Prórroga 3', descripcion: 'Consolidación estratégica.', fecha_inicio: '2024-03-04', fecha_fin: '2024-07-04', duracion_meses: 4 },
      { id: 8, contrato_id: 2, numero: 4, label: 'Prórroga 4', descripcion: 'Renovación anual — planta.', fecha_inicio: '2024-07-05', fecha_fin: '2026-08-15', duracion_meses: 12 },
    ],
  },
  // ── PRÓXIMO A VENCER ─────────────────────────────────────────────────────
  {
    id: 3,
    empleado_nombre: 'Carlos Rodríguez',
    empleado_cargo: 'Desarrollador Backend',
    empleado_departamento: 'Tecnología',
    request_status: 'pendiente',
    documentos: [
      { id: 6, contrato_id: 3, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2024-01-10', firmado: true },
    ],
    prorrogas: [
      { id: 9,  contrato_id: 3, numero: 0, label: 'Contrato Inicial', descripcion: 'Fase inicial de desarrollo.', fecha_inicio: '2024-01-10', fecha_fin: '2024-05-10', duracion_meses: 4 },
      { id: 10, contrato_id: 3, numero: 1, label: 'Prórroga 1', descripcion: 'Desarrollo de microservicios.', fecha_inicio: '2024-05-11', fecha_fin: '2026-04-10', duracion_meses: 4 },
    ],
  },
  {
    id: 4,
    empleado_nombre: 'Ana Torres',
    empleado_cargo: 'Diseñadora UX/UI',
    empleado_departamento: 'Producto',
    request_status: 'pendiente',
    documentos: [
      { id: 7,  contrato_id: 4, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2022-08-01', firmado: true },
      { id: 8,  contrato_id: 4, nombre: 'Evaluación Desempeño Anual', tipo: 'evaluacion', fecha: '2024-12-10', firmado: true },
      { id: 9,  contrato_id: 4, nombre: 'Otrosí Prórroga 5', tipo: 'otrosi', fecha: '2024-12-06', firmado: true },
    ],
    prorrogas: [
      { id: 11, contrato_id: 4, numero: 0, label: 'Contrato Inicial', descripcion: 'Prueba de talento creativo.', fecha_inicio: '2022-08-01', fecha_fin: '2022-12-01', duracion_meses: 4 },
      { id: 12, contrato_id: 4, numero: 1, label: 'Prórroga 1', descripcion: 'Rediseño de plataforma corporativa.', fecha_inicio: '2022-12-02', fecha_fin: '2023-04-02', duracion_meses: 4 },
      { id: 13, contrato_id: 4, numero: 2, label: 'Prórroga 2', descripcion: 'Design system corporativo.', fecha_inicio: '2023-04-03', fecha_fin: '2023-08-03', duracion_meses: 4 },
      { id: 14, contrato_id: 4, numero: 3, label: 'Prórroga 3', descripcion: 'Liderazgo del squad de diseño.', fecha_inicio: '2023-08-04', fecha_fin: '2023-12-04', duracion_meses: 4 },
      { id: 15, contrato_id: 4, numero: 4, label: 'Prórroga 4', descripcion: 'Renovación anual.', fecha_inicio: '2023-12-05', fecha_fin: '2024-12-05', duracion_meses: 12 },
      { id: 16, contrato_id: 4, numero: 5, label: 'Prórroga 5', descripcion: 'Expansión regional.', fecha_inicio: '2024-12-06', fecha_fin: '2026-04-25', duracion_meses: 12 },
    ],
  },
  // ── VENCIDO ───────────────────────────────────────────────────────────────
  {
    id: 5,
    empleado_nombre: 'Luis Morales',
    empleado_cargo: 'Contador Público',
    empleado_departamento: 'Finanzas',
    request_status: 'rechazada',
    documentos: [
      { id: 10, contrato_id: 5, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-02-01', firmado: true },
    ],
    prorrogas: [
      { id: 17, contrato_id: 5, numero: 0, label: 'Contrato Inicial', descripcion: 'Período de prueba.', fecha_inicio: '2025-02-01', fecha_fin: '2025-06-01', duracion_meses: 4 },
      { id: 18, contrato_id: 5, numero: 1, label: 'Prórroga 1', descripcion: 'Cierre fiscal Q3.', fecha_inicio: '2025-06-02', fecha_fin: '2025-10-02', duracion_meses: 4 },
    ],
  },
  // ── COMPLETADA ────────────────────────────────────────────────────────────
  {
    id: 6,
    empleado_nombre: 'Sandra Vargas',
    empleado_cargo: 'Especialista de RRHH',
    empleado_departamento: 'Recursos Humanos',
    request_status: 'completada',
    documentos: [
      { id: 11, contrato_id: 6, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2024-01-10', firmado: true },
      { id: 12, contrato_id: 6, nombre: 'Acta de Terminación', tipo: 'otro', fecha: '2026-01-10', firmado: true },
    ],
    prorrogas: [
      { id: 19, contrato_id: 6, numero: 0, label: 'Contrato Inicial', descripcion: 'Incorporación al equipo de talento.', fecha_inicio: '2024-01-10', fecha_fin: '2024-05-10', duracion_meses: 4 },
      { id: 20, contrato_id: 6, numero: 1, label: 'Prórroga 1', descripcion: 'Programa de bienestar corporativo.', fecha_inicio: '2024-05-11', fecha_fin: '2024-09-11', duracion_meses: 4 },
      { id: 21, contrato_id: 6, numero: 2, label: 'Prórroga 2', descripcion: 'Reclutamiento masivo Q4.', fecha_inicio: '2024-09-12', fecha_fin: '2026-01-10', duracion_meses: 4 },
    ],
  },
];