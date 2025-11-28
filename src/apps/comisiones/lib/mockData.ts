/**
 * DATOS MOCK PARA SIMULAR SISTEMA DE COMISIONES
 *
 * LÓGICA DE NEGOCIO IMPLEMENTADA:
 * =================================
 *
 * 1. PORCENTAJES MENSUALES:
 *    - Se definen por mes (ej: "2025-11")
 *    - Aplican a todas las tiendas
 *    - Gerente: 10%, Asesores: 85%, Cajeros: 3%, Logísticos: 2%
 *
 * 2. PRESUPUESTOS DIARIOS:
 *    - Cada día tiene presupuesto diferente por tienda
 *    - Ejemplo: Tienda A = 14.000.000, Tienda B = 8.000.000
 *
 * 3. DISTRIBUCIÓN DIARIA:
 *    - Gerente: 10% del presupuesto diario
 *    - Resto se divide entre asesores que trabajen ese día
 *    - Ejemplo: 14M - 10% = 12.6M ÷ 4 asesores = 3.15M cada uno
 *
 * 4. CÁLCULO DE COMISIONES:
 *    - Cumplimiento = (Ventas ÷ Presupuesto) × 100
 *    - % Comisión según cumplimiento y rol
 *    - Comisión = (Ventas × % Comisión) ÷ 100
 *
 * 5. ACUMULACIÓN MENSUAL:
 *    - Comisiones se acumulan día tras día
 *    - Al final del mes se conoce la comisión total
 *
 * EJEMPLO CON DATOS MOCK:
 * =======================
 * Día 27 Nov - Tienda Cosmocentro (14M presupuesto)
 * - Gerente: 1.4M presupuesto → 1.68M ventas = 120% → 100% comisión → $1.68M
 * - 3 Asesores: 4.2M cada uno → ventas variables → comisiones según %
 * - Cajero: 420K presupuesto → 504K ventas = 120% → 15% comisión → $75.6K
 *
 * INSTRUCCIONES PARA PRODUCCIÓN:
 * ===============================
 * 1. Configurar BD Directus con las tablas definidas
 * 2. Ir a src/apps/comisiones/api/directus/read.ts
 * 3. Cambiar: const USE_MOCK_DATA = false;
 * 4. Reiniciar aplicación
 */

import {
  DirectusAsesor,
  DirectusTienda,
  DirectusCargo,
  DirectusPresupuestoDiarioTienda,
  DirectusPorcentajeMensual,
  DirectusPresupuestoDiarioEmpleado,
  DirectusVentasDiariasEmpleado,
  DirectusVentasDiariasTienda,
} from "../types";

// ==================== DATOS MOCK ====================

export const mockTiendas: DirectusTienda[] = [
  {
    id: 1,
    nombre: "Cosmocentro",
    codigo_ultra: 15,
    empresa: "Naranka",
  },
  {
    id: 2,
    nombre: "Unico Cali",
    codigo_ultra: 7,
    empresa: "Naranka",
  },
  {
    id: 3,
    nombre: "Jamundi Centro",
    codigo_ultra: 13,
    empresa: "Kancan",
  },
];

export const mockCargos: DirectusCargo[] = [
  { id: 1, nombre: "Gerente" },
  { id: 2, nombre: "Asesor" },
  { id: 3, nombre: "Cajero" },
  { id: 4, nombre: "Logistico" },
];

export const mockAsesores: DirectusAsesor[] = [
  // Tienda cosmocentro
  {
    id: 1,
    nombre: "Enrique Lopez",
    codigo_asesor: 1001,
    documento: 12345678,
    tienda_id: 1,
    cargo_id: 1, // Gerente
  },
  {
    id: 2,
    nombre: "Maria Rodriguez",
    codigo_asesor: 1002,
    documento: 87654321,
    tienda_id: 1,
    cargo_id: 2, // Asesor
  },
  {
    id: 3,
    nombre: "Pedro Gomez",
    codigo_asesor: 1003,
    documento: 11223344,
    tienda_id: 1,
    cargo_id: 2, // Asesor
  },
  {
    id: 4,
    nombre: "Luisa Perez",
    codigo_asesor: 1004,
    documento: 55667788,
    tienda_id: 1,
    cargo_id: 3, // Cajero
  },
  // Tienda unico cali
  {
    id: 5,
    nombre: "Carlos Gomez",
    codigo_asesor: 2001,
    documento: 99887766,
    tienda_id: 2,
    cargo_id: 1, // Gerente
  },
  {
    id: 6,
    nombre: "Sofia Rodriguez",
    codigo_asesor: 2002,
    documento: 55443322,
    tienda_id: 2,
    cargo_id: 2, // Asesor
  },
];

export const mockPresupuestosDiarios: DirectusPresupuestoDiarioTienda[] = [
  // Día 27 de noviembre - presupuestos variables por día
  {
    id: 1,
    tienda_id: 1,
    presupuesto: 14000000, // 14M - día alto
    fecha: "2025-11-27",
  },
  {
    id: 2,
    tienda_id: 2,
    presupuesto: 8000000, // 8M - día normal
    fecha: "2025-11-27",
  },
  {
    id: 3,
    tienda_id: 3,
    presupuesto: 6000000, // 6M - día medio
    fecha: "2025-11-27",
  },
  // Día anterior para acumulación mensual
  {
    id: 4,
    tienda_id: 1,
    presupuesto: 12000000, // 12M
    fecha: "2025-11-26",
  },
  {
    id: 5,
    tienda_id: 2,
    presupuesto: 9000000, // 9M
    fecha: "2025-11-26",
  },
];

export const mockPorcentajesMensuales: DirectusPorcentajeMensual[] = [
  // Porcentajes mensuales - aplican a todas las tiendas del mes
  {
    id: 1,
    fecha: "2025-11", // Mes completo
    porcentaje_gerente: 10,
    porcentaje_asesor: 85,
    porcentaje_cajero: 3,
    porcentaje_logistico: 2,
    tienda_id: 1, // Puede ser null para aplicar globalmente
  },
];

export const mockPresupuestosEmpleados: DirectusPresupuestoDiarioEmpleado[] = [
  // Día 27 - Tienda 1 (Cosmocentro) - Presupuesto: 14.000.000
  // Gerente: 10% = 1.400.000
  // Resto para asesores: 12.600.000
  // 3 asesores trabajando: 12.600.000 ÷ 3 = 4.200.000 cada uno
  {
    id: 1,
    asesor_id: 1, // Gerente
    fecha: "2025-11-27",
    presupuesto: 1400000, // 10% de 14M
    tienda_id: 1,
  },
  {
    id: 2,
    asesor_id: 2, // Asesor 1
    fecha: "2025-11-27",
    presupuesto: 4200000, // 12.6M ÷ 3
    tienda_id: 1,
  },
  {
    id: 3,
    asesor_id: 3, // Asesor 2
    fecha: "2025-11-27",
    presupuesto: 4200000, // 12.6M ÷ 3
    tienda_id: 1,
  },
  {
    id: 4,
    asesor_id: 4, // Cajero
    fecha: "2025-11-27",
    presupuesto: 420000, // 3% de 14M
    tienda_id: 1,
  },

  // Día 27 - Tienda 2 (Unico Cali) - Presupuesto: 8.000.000
  // Gerente: 10% = 800.000
  // Resto para asesores: 7.200.000
  // 1 asesor trabajando: 7.200.000 ÷ 1 = 7.200.000
  {
    id: 5,
    asesor_id: 5, // Gerente
    fecha: "2025-11-27",
    presupuesto: 800000, // 10% de 8M
    tienda_id: 2,
  },
  {
    id: 6,
    asesor_id: 6, // Asesor único
    fecha: "2025-11-27",
    presupuesto: 7200000, // 90% de 8M (gerente + asesor)
    tienda_id: 2,
  },

  // Día anterior para acumulación mensual
  {
    id: 7,
    asesor_id: 1,
    fecha: "2025-11-26",
    presupuesto: 1200000, // 10% de 12M
    tienda_id: 1,
  },
  {
    id: 8,
    asesor_id: 2,
    fecha: "2025-11-26",
    presupuesto: 3600000, // Parte del 90% restante
    tienda_id: 1,
  },
];

export const mockVentasEmpleados: DirectusVentasDiariasEmpleado[] = [
  // Día 27 - Tienda 1 (Cosmocentro)
  // Gerente: presupuesto 1.400.000 → venta 1.680.000 = 120% cumplimiento
  {
    id: 1,
    asesor_id: 1,
    fecha: "2025-11-27",
    ventas: 1680000, // 120% cumplimiento
  },
  // Asesor 1: presupuesto 4.200.000 → venta 3.780.000 = 90% cumplimiento
  {
    id: 2,
    asesor_id: 2,
    fecha: "2025-11-27",
    ventas: 3780000, // 90% cumplimiento
  },
  // Asesor 2: presupuesto 4.200.000 → venta 5.040.000 = 120% cumplimiento
  {
    id: 3,
    asesor_id: 3,
    fecha: "2025-11-27",
    ventas: 5040000, // 120% cumplimiento
  },
  // Cajero: presupuesto 420.000 → venta 504.000 = 120% cumplimiento
  {
    id: 4,
    asesor_id: 4,
    fecha: "2025-11-27",
    ventas: 504000, // 120% cumplimiento
  },

  // Día 27 - Tienda 2 (Unico Cali)
  // Gerente: presupuesto 800.000 → venta 640.000 = 80% cumplimiento
  {
    id: 5,
    asesor_id: 5,
    fecha: "2025-11-27",
    ventas: 640000, // 80% cumplimiento
  },
  // Asesor único: presupuesto 7.200.000 → venta 7.920.000 = 110% cumplimiento
  {
    id: 6,
    asesor_id: 6,
    fecha: "2025-11-27",
    ventas: 7920000, // 110% cumplimiento
  },

  // Día anterior para acumulación mensual
  {
    id: 7,
    asesor_id: 1,
    fecha: "2025-11-26",
    ventas: 1440000, // 120% del presupuesto del día anterior
  },
  {
    id: 8,
    asesor_id: 2,
    fecha: "2025-11-26",
    ventas: 3600000, // 100% cumplimiento
  },
];

export const mockVentasTienda: DirectusVentasDiariasTienda[] = [
  // Día 27 - Ventas totales = suma de ventas de empleados
  {
    id: 1,
    tienda_id: 1,
    fecha: "2025-11-27",
    ventas_totales: 10452000, // 1.680.000 + 3.780.000 + 5.040.000 + 504.000
  },
  {
    id: 2,
    tienda_id: 2,
    fecha: "2025-11-27",
    ventas_totales: 8560000, // 640.000 + 7.920.000
  },
  {
    id: 3,
    tienda_id: 3,
    fecha: "2025-11-27",
    ventas_totales: 4800000,
  },
  // Día anterior para acumulación mensual
  {
    id: 4,
    tienda_id: 1,
    fecha: "2025-11-26",
    ventas_totales: 5040000, // 1.440.000 + 3.600.000
  },
];

// ==================== FUNCIONES MOCK ====================

/**
 * Simula obtener tiendas
 */
export async function mockObtenerTiendas(): Promise<DirectusTienda[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return mockTiendas;
}

/**
 * Simula obtener cargos
 */
export async function mockObtenerCargos(): Promise<DirectusCargo[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockCargos;
}

/**
 * Simula obtener asesores
 */
export async function mockObtenerAsesores(): Promise<DirectusAsesor[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockAsesores;
}

/**
 * Simula obtener presupuestos diarios
 */
export async function mockObtenerPresupuestosDiarios(
  tiendaId?: number,
  fechaInicio?: string,
  fechaFin?: string
): Promise<DirectusPresupuestoDiarioTienda[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  let filtered = mockPresupuestosDiarios;

  if (tiendaId) {
    filtered = filtered.filter((p) => p.tienda_id === tiendaId);
  }

  if (fechaInicio && fechaFin) {
    filtered = filtered.filter(
      (p) => p.fecha >= fechaInicio && p.fecha <= fechaFin
    );
  }

  return filtered;
}

/**
 * Simula obtener porcentajes mensuales
 */
export async function mockObtenerPorcentajesMensuales(
  tiendaId?: number,
  mesAnio?: string
): Promise<DirectusPorcentajeMensual[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  let filtered = mockPorcentajesMensuales;

  if (tiendaId) {
    filtered = filtered.filter((p) => p.tienda_id === tiendaId);
  }

  if (mesAnio) {
    filtered = filtered.filter((p) => p.fecha === mesAnio);
  }

  return filtered;
}

/**
 * Simula obtener presupuestos de empleados
 */
export async function mockObtenerPresupuestosEmpleados(
  tiendaId?: number,
  fecha?: string
): Promise<DirectusPresupuestoDiarioEmpleado[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  let filtered = mockPresupuestosEmpleados;

  if (tiendaId) {
    filtered = filtered.filter((p) => p.tienda_id === tiendaId);
  }

  if (fecha) {
    filtered = filtered.filter((p) => p.fecha === fecha);
  }

  return filtered;
}

/**
 * Simula obtener ventas de empleados
 */
export async function mockObtenerVentasEmpleados(
  tiendaId?: number,
  fecha?: string
): Promise<DirectusVentasDiariasEmpleado[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = mockVentasEmpleados;

  if (tiendaId) {
    filtered = filtered.filter((v) => {
      const asesor = mockAsesores.find((a) => a.id === v.asesor_id);
      return asesor?.tienda_id === tiendaId;
    });
  }

  if (fecha) {
    filtered = filtered.filter((v) => v.fecha === fecha);
  }

  return filtered;
}

/**
 * Simula obtener ventas de tienda
 */
export async function mockObtenerVentasTienda(
  tiendaId?: number,
  fecha?: string
): Promise<DirectusVentasDiariasTienda[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  let filtered = mockVentasTienda;

  if (tiendaId) {
    filtered = filtered.filter((v) => v.tienda_id === tiendaId);
  }

  if (fecha) {
    filtered = filtered.filter((v) => v.fecha === fecha);
  }

  return filtered;
}
