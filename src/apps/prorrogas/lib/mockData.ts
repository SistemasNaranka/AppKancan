import { Contrato } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — reemplazar con llamadas reales a la API
// Usa los tipos Directus: snake_case, ids numéricos
// ─────────────────────────────────────────────────────────────────────────────

export const mockContratos: Contrato[] = [
  // ── VIGENTE ──────────────────────────────────────────────────────────────
  {
    id: 1,
    documento: "DOC-2023-001",
    nombre: "Juan",
    apellido: "Pérez",
    cargo: "Analista de Ciberseguridad Senior",
    tipo_contrato: "Término Fijo",
    prorroga: "Sí",
    duracion: "12 meses",
    fecha_ingreso: "2023-01-15",
    fecha_final: "2026-07-20",
  },
  {
    id: 2,
    documento: "DOC-2023-002",
    nombre: "María",
    apellido: "González",
    cargo: "Gerente de Proyectos",
    tipo_contrato: "Término Indefinido",
    prorroga: "Sí",
    duracion: "Indefinido",
    fecha_ingreso: "2023-03-01",
    fecha_final: "2026-08-15",
  },
  // ── PRÓXIMO A VENCER ─────────────────────────────────────────────────────
  {
    id: 3,
    documento: "DOC-2024-003",
    nombre: "Carlos",
    apellido: "Rodríguez",
    cargo: "Desarrollador Backend",
    tipo_contrato: "Término Fijo",
    prorroga: "En proceso",
    duracion: "12 meses",
    fecha_ingreso: "2024-01-10",
    fecha_final: "2026-04-10",
  },
  {
    id: 4,
    documento: "DOC-2022-004",
    nombre: "Ana",
    apellido: "Torres",
    cargo: "Diseñadora UX/UI",
    tipo_contrato: "Término Indefinido",
    prorroga: "Sí",
    duracion: "Indefinido",
    fecha_ingreso: "2022-08-01",
    fecha_final: "2026-04-25",
  },
  // ── VENCIDO ───────────────────────────────────────────────────────────────
  {
    id: 5,
    documento: "DOC-2025-005",
    nombre: "Luis",
    apellido: "Morales",
    cargo: "Contador Público",
    tipo_contrato: "Término Fijo",
    prorroga: "No",
    duracion: "8 meses",
    fecha_ingreso: "2025-02-01",
    fecha_final: "2025-10-02",
  },
  // ── COMPLETADA ────────────────────────────────────────────────────────────
  {
    id: 6,
    documento: "DOC-2024-006",
    nombre: "Sandra",
    apellido: "Vargas",
    cargo: "Especialista de RRHH",
    tipo_contrato: "Término Fijo",
    prorroga: "Sí",
    duracion: "12 meses",
    fecha_ingreso: "2024-01-10",
    fecha_final: "2026-01-10",
  },
];
