// import { Contrato, Employee } from '../types/types';

// // ─────────────────────────────────────────────────────────────────────────────
// // MOCK DATA — Gestión de Prórrogas v2
// // Fechas calculadas relativas a hoy: 2026-03-24
// //   critico   → vence en 0–7 días   (hasta 2026-03-31)
// //   por_vencer→ vence en 8–30 días  (hasta 2026-04-23)
// //   activo    → vence en > 30 días  (desde 2026-04-24)
// //   vencido   → ya expirado         (antes de 2026-03-24)
// // ─────────────────────────────────────────────────────────────────────────────

// // ── Helper: genera array de prórrogas ─────────────────────────────────────

// interface PSeq {
//   i: string;  // fecha_inicio YYYY-MM-DD
//   f: string;  // fecha_fin    YYYY-MM-DD
//   m: number;  // duracion_meses
//   d: string;  // descripcion
// }

// let _pid = 1;
// function makeProgs(contratoId: number, seqs: PSeq[]) {
//   return seqs.map((p, n) => ({
//     id: _pid++,
//     contrato_id: contratoId,
//     numero: n,
//     label: n === 0 ? 'Contrato Inicial' : `Prórroga ${n}`,
//     descripcion: p.d,
//     fecha_ingreso: p.i,
//     fecha_final: p.f,
//     duracion_meses: p.m,
//   }));
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CONTRATOS
// // ─────────────────────────────────────────────────────────────────────────────

// export const mockContratos: Contrato[] = [

//   // ══════════════════════════════════════════════════════════════════════════
//   // CRÍTICO — vence en 0–7 días (hasta 2026-03-31)
//   // ══════════════════════════════════════════════════════════════════════════

//   {
//     id: 1,
//     numero_contrato: 'CTR-2026-001',
//     empleado_id: 1,
//     nombre: 'Roberto Sánchez',
//     cargo: 'Especialista en Servicios IT',
//     empleado_area: 'Tecnología',
//     empresa: 'Constructora Andina S.A.',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 1, contrato_id: 1, nombre: 'Contrato Original.pdf',   tipo: 'contrato',  fecha: '2024-12-01', firmado: true  },
//       { id: 2, contrato_id: 1, nombre: 'Otrosí Prórroga 3.pdf',   tipo: 'otrosi',    fecha: '2025-12-01', firmado: true  },
//       { id: 3, contrato_id: 1, nombre: 'Evaluación Desempeño Q4', tipo: 'evaluacion',fecha: '2025-11-20', firmado: false },
//     ],
//     prorrogas: makeProgs(1, [
//       { i: '2024-12-01', f: '2025-03-31', m: 4,  d: 'Período de incorporación y onboarding en infraestructura.' },
//       { i: '2025-04-01', f: '2025-07-31', m: 4,  d: 'Desarrollo de soluciones cloud y migración de sistemas.' },
//       { i: '2025-08-01', f: '2025-11-30', m: 4,  d: 'Liderazgo del equipo de soporte técnico avanzado.' },
//       { i: '2025-12-01', f: '2026-03-27', m: 4,  d: 'Consolidación de proyectos de ciberseguridad.' },
//     ]),
//   },

//   {
//     id: 2,
//     numero_contrato: 'CTR-2026-002',
//     empleado_id: 2,
//     nombre: 'Miguel Torres',
//     cargo: 'Coordinador de Mantenimiento',
//     empleado_area: 'Operaciones',
//     empresa: 'TechSolutions Perú',
//     request_status: 'en_revision',
//     documentos: [
//       { id: 4, contrato_id: 2, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-04-01', firmado: true },
//       { id: 5, contrato_id: 2, nombre: 'Otrosí Prórroga 2.pdf', tipo: 'otrosi',   fecha: '2025-12-01', firmado: true },
//     ],
//     prorrogas: makeProgs(2, [
//       { i: '2025-04-01', f: '2025-07-31', m: 4, d: 'Integración de sistemas de mantenimiento predictivo.' },
//       { i: '2025-08-01', f: '2025-11-30', m: 4, d: 'Gestión de flota y optimización de recursos.' },
//       { i: '2025-12-01', f: '2026-03-29', m: 4, d: 'Implementación de plan de mantenimiento preventivo anual.' },
//     ]),
//   },

//   {
//     id: 3,
//     numero_contrato: 'CTR-2026-003',
//     empleado_id: 3,
//     nombre: 'Ana Ramírez',
//     cargo: 'Consultora Estratégica Senior',
//     empleado_area: 'Consultoría',
//     empresa: 'Consultoría Estratégica S.A.',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 6, contrato_id: 3, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-12-01', firmado: true },
//     ],
//     prorrogas: makeProgs(3, [
//       { i: '2025-12-01', f: '2026-03-30', m: 4, d: 'Análisis estratégico de mercado y posicionamiento competitivo.' },
//     ]),
//   },

//   {
//     id: 4,
//     numero_contrato: 'CTR-2026-004',
//     empleado_id: 4,
//     nombre: 'Carlos Vega',
//     cargo: 'Coordinador Logístico',
//     empleado_area: 'Logística',
//     empresa: 'Logística del Norte S.A.',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 7, contrato_id: 4, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-08-01', firmado: true },
//       { id: 8, contrato_id: 4, nombre: 'Otrosí Prórroga 1.pdf', tipo: 'otrosi',   fecha: '2025-12-01', firmado: true },
//     ],
//     prorrogas: makeProgs(4, [
//       { i: '2025-08-01', f: '2025-11-30', m: 4, d: 'Diseño de rutas y optimización de cadena de suministro.' },
//       { i: '2025-12-01', f: '2026-03-31', m: 4, d: 'Supervisión de operaciones regionales y distribución.' },
//     ]),
//   },

//   {
//     id: 5,
//     numero_contrato: 'CTR-2026-005',
//     empleado_id: 5,
//     nombre: 'Lucía Fernández',
//     cargo: 'Analista de Suministros',
//     empleado_area: 'Compras',
//     empresa: 'Servicios Técnicos SRL',
//     request_status: 'en_revision',
//     documentos: [
//       { id: 9,  contrato_id: 5, nombre: 'Contrato Original.pdf',   tipo: 'contrato',  fecha: '2024-03-29', firmado: true  },
//       { id: 10, contrato_id: 5, nombre: 'Otrosí Prórroga 4.pdf',   tipo: 'otrosi',    fecha: '2025-07-29', firmado: true  },
//       { id: 11, contrato_id: 5, nombre: 'Evaluación Desempeño 2025', tipo: 'evaluacion', fecha: '2025-06-15', firmado: true },
//     ],
//     prorrogas: makeProgs(5, [
//       { i: '2024-03-29', f: '2024-07-28', m: 4,  d: 'Incorporación al área de gestión de compras.' },
//       { i: '2024-07-29', f: '2024-11-28', m: 4,  d: 'Optimización del proceso de licitaciones.' },
//       { i: '2024-11-29', f: '2025-03-28', m: 4,  d: 'Auditoría de proveedores estratégicos.' },
//       { i: '2025-03-29', f: '2025-07-28', m: 4,  d: 'Implementación de sistema ERP de compras.' },
//       { i: '2025-07-29', f: '2026-03-28', m: 12, d: 'Renovación anual — consolidación en planta.' },
//     ]),
//   },

//   // ══════════════════════════════════════════════════════════════════════════
//   // POR VENCER — vence en 8–30 días (2026-04-01 al 2026-04-23)
//   // ══════════════════════════════════════════════════════════════════════════

//   {
//     id: 6,
//     numero_contrato: 'CTR-2026-006',
//     empleado_id: 6,
//     nombre: 'Javier Morales',
//     cargo: 'Desarrollador Full Stack',
//     empleado_area: 'Tecnología',
//     empresa: 'Innovatech Corp.',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 12, contrato_id: 6, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-06-03', firmado: true },
//     ],
//     prorrogas: makeProgs(6, [
//       { i: '2025-06-03', f: '2025-10-02', m: 4, d: 'Desarrollo de módulos de facturación electrónica.' },
//       { i: '2025-10-03', f: '2026-04-03', m: 4, d: 'Arquitectura de microservicios para plataforma SaaS.' },
//     ]),
//   },

//   {
//     id: 7,
//     numero_contrato: 'CTR-2026-007',
//     empleado_id: 7,
//     nombre: 'Sofía Mendoza',
//     cargo: 'Gerente de Proyectos',
//     empleado_area: 'Dirección',
//     empresa: 'Distribuidora del Sur Ltda.',
//     request_status: 'en_revision',
//     documentos: [
//       { id: 13, contrato_id: 7, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2024-08-08', firmado: true },
//       { id: 14, contrato_id: 7, nombre: 'Otrosí Prórroga 3.pdf', tipo: 'otrosi',   fecha: '2025-08-08', firmado: true },
//     ],
//     prorrogas: makeProgs(7, [
//       { i: '2024-08-08', f: '2024-12-07', m: 4,  d: 'Liderazgo de portafolio de proyectos estratégicos.' },
//       { i: '2024-12-08', f: '2025-04-07', m: 4,  d: 'Transformación digital de la cadena de valor.' },
//       { i: '2025-04-08', f: '2025-08-07', m: 4,  d: 'Optimización de procesos de distribución regional.' },
//       { i: '2025-08-08', f: '2026-04-07', m: 12, d: 'Renovación anual — dirección de proyectos críticos.' },
//     ]),
//   },

//   {
//     id: 8,
//     numero_contrato: 'CTR-2026-008',
//     empleado_id: 8,
//     nombre: 'Diego Vargas',
//     cargo: 'Analista Financiero Senior',
//     empleado_area: 'Finanzas',
//     empresa: 'Minería del Pacífico S.A.',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 15, contrato_id: 8, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-06-11', firmado: true },
//       { id: 16, contrato_id: 8, nombre: 'Otrosí Prórroga 1.pdf', tipo: 'otrosi',   fecha: '2025-10-11', firmado: true },
//     ],
//     prorrogas: makeProgs(8, [
//       { i: '2025-06-11', f: '2025-10-10', m: 4, d: 'Análisis de estados financieros y proyecciones de inversión.' },
//       { i: '2025-10-11', f: '2026-04-10', m: 4, d: 'Modelado financiero para nuevos proyectos mineros.' },
//     ]),
//   },

//   {
//     id: 9,
//     numero_contrato: 'CTR-2026-009',
//     empleado_id: 9,
//     nombre: 'Valentina Cruz',
//     cargo: 'Diseñadora UX/UI',
//     empleado_area: 'Producto',
//     empresa: 'GlobalTech Solutions',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 17, contrato_id: 9, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2024-10-15', firmado: true },
//       { id: 18, contrato_id: 9, nombre: 'Otrosí Prórroga 2.pdf', tipo: 'otrosi',   fecha: '2025-10-15', firmado: true },
//     ],
//     prorrogas: makeProgs(9, [
//       { i: '2024-10-15', f: '2025-02-14', m: 4,  d: 'Diseño del sistema de interfaz corporativo.' },
//       { i: '2025-02-15', f: '2025-06-14', m: 4,  d: 'Design system y guías de estilo cross-platform.' },
//       { i: '2025-06-15', f: '2025-10-14', m: 4,  d: 'Rediseño de la plataforma de clientes.' },
//       { i: '2025-10-15', f: '2026-04-14', m: 12, d: 'Renovación anual — liderazgo del equipo de diseño.' },
//     ]),
//   },

//   {
//     id: 10,
//     numero_contrato: 'CTR-2026-010',
//     empleado_id: 10,
//     nombre: 'Andrés Lima',
//     cargo: 'Especialista en Riesgos',
//     empleado_area: 'Riesgo y Cumplimiento',
//     empresa: 'Banco Central Andino',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 19, contrato_id: 10, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-06-19', firmado: true },
//     ],
//     prorrogas: makeProgs(10, [
//       { i: '2025-06-19', f: '2025-10-18', m: 4, d: 'Evaluación de riesgo crediticio y portafolios.' },
//       { i: '2025-10-19', f: '2026-04-18', m: 4, d: 'Implementación de modelos de riesgo operacional bajo Basilea III.' },
//     ]),
//   },

//   {
//     id: 11,
//     numero_contrato: 'CTR-2026-011',
//     empleado_id: 11,
//     nombre: 'Patricia Ríos',
//     cargo: 'Especialista de RRHH',
//     empleado_area: 'Recursos Humanos',
//     empresa: 'Constructora Andina S.A.',
//     request_status: 'en_revision',
//     documentos: [
//       { id: 20, contrato_id: 11, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-12-21', firmado: true },
//     ],
//     prorrogas: makeProgs(11, [
//       { i: '2025-12-21', f: '2026-04-20', m: 4, d: 'Diseño de plan de bienestar corporativo y reclutamiento masivo.' },
//     ]),
//   },

//   {
//     id: 12,
//     numero_contrato: 'CTR-2026-012',
//     empleado_id: 12,
//     nombre: 'Hernán Castro',
//     cargo: 'Ingeniero de Datos',
//     empleado_area: 'Tecnología',
//     empresa: 'TechSolutions Perú',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 21, contrato_id: 12, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-08-23', firmado: true },
//       { id: 22, contrato_id: 12, nombre: 'Otrosí Prórroga 1.pdf', tipo: 'otrosi',   fecha: '2025-12-23', firmado: true },
//     ],
//     prorrogas: makeProgs(12, [
//       { i: '2025-08-23', f: '2025-12-22', m: 4, d: 'Diseño de arquitectura de datos para plataforma de analytics.' },
//       { i: '2025-12-23', f: '2026-04-22', m: 4, d: 'Implementación de pipelines ETL y data lake corporativo.' },
//     ]),
//   },

//   {
//     id: 13,
//     numero_contrato: 'CTR-2026-013',
//     empleado_id: 13,
//     nombre: 'Isabel Romero',
//     cargo: 'Analista de Operaciones',
//     empleado_area: 'Operaciones',
//     empresa: 'Logística del Norte S.A.',
//     request_status: 'pendiente',
//     documentos: [
//       { id: 23, contrato_id: 13, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-12-24', firmado: true },
//     ],
//     prorrogas: makeProgs(13, [
//       { i: '2025-12-24', f: '2026-04-23', m: 4, d: 'Análisis de eficiencia operativa y reducción de costos logísticos.' },
//     ]),
//   },

//   // ══════════════════════════════════════════════════════════════════════════
//   // ACTIVO — vence en > 30 días (desde 2026-04-24 en adelante)
//   // ══════════════════════════════════════════════════════════════════════════

//   {
//     id: 14,
//     numero_contrato: 'CTR-2026-014',
//     empleado_id: 14,
//     nombre: 'Fernando Díaz',
//     cargo: 'Contador Público Senior',
//     empleado_area: 'Finanzas',
//     empresa: 'Servicios Técnicos SRL',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 24, contrato_id: 14, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2026-01-16', firmado: true },
//     ],
//     prorrogas: makeProgs(14, [
//       { i: '2026-01-16', f: '2026-05-15', m: 4, d: 'Cierre fiscal anual y auditoría de cuentas corporativas.' },
//     ]),
//   },

//   {
//     id: 15,
//     numero_contrato: 'CTR-2026-015',
//     empleado_id: 15,
//     nombre: 'Camila Reyes',
//     cargo: 'Analista de Marketing Digital',
//     empleado_area: 'Marketing',
//     empresa: 'Innovatech Corp.',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 25, contrato_id: 15, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-11-21', firmado: true },
//       { id: 26, contrato_id: 15, nombre: 'Otrosí Prórroga 1.pdf', tipo: 'otrosi',   fecha: '2026-03-21', firmado: true },
//     ],
//     prorrogas: makeProgs(15, [
//       { i: '2025-11-21', f: '2026-03-20', m: 4, d: 'Estrategia de contenidos y gestión de redes sociales.' },
//       { i: '2026-03-21', f: '2026-07-20', m: 4, d: 'Lanzamiento de campaña de marketing digital omnicanal.' },
//     ]),
//   },

//   {
//     id: 16,
//     numero_contrato: 'CTR-2026-016',
//     empleado_id: 16,
//     nombre: 'Eduardo Peña',
//     cargo: 'Ingeniero Civil Senior',
//     empleado_area: 'Ingeniería',
//     empresa: 'Distribuidora del Sur Ltda.',
//     request_status: 'completada',
//     documentos: [
//       { id: 27, contrato_id: 16, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2024-10-01', firmado: true },
//       { id: 28, contrato_id: 16, nombre: 'Otrosí Prórroga 4.pdf', tipo: 'otrosi',   fecha: '2025-10-01', firmado: true },
//     ],
//     prorrogas: makeProgs(16, [
//       { i: '2024-10-01', f: '2025-01-31', m: 4,  d: 'Supervisión técnica de obra civil en instalaciones.' },
//       { i: '2025-02-01', f: '2025-05-31', m: 4,  d: 'Gestión de proyectos de infraestructura regional.' },
//       { i: '2025-06-01', f: '2025-09-30', m: 4,  d: 'Control de calidad y certificaciones de obra.' },
//       { i: '2025-10-01', f: '2025-09-30', m: 4,  d: 'Coordinación de proyectos de expansión.' },
//       { i: '2025-10-01', f: '2026-09-30', m: 12, d: 'Renovación anual — jefatura de ingeniería.' },
//     ]),
//   },

//   {
//     id: 17,
//     numero_contrato: 'CTR-2026-017',
//     empleado_id: 17,
//     nombre: 'Marcela Torres',
//     cargo: 'Geóloga de Exploración',
//     empleado_area: 'Exploración',
//     empresa: 'Minería del Pacífico S.A.',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 29, contrato_id: 17, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2026-02-16', firmado: true },
//     ],
//     prorrogas: makeProgs(17, [
//       { i: '2026-02-16', f: '2026-06-15', m: 4, d: 'Exploración geológica en nuevos yacimientos del norte.' },
//     ]),
//   },

//   {
//     id: 18,
//     numero_contrato: 'CTR-2026-018',
//     empleado_id: 18,
//     nombre: 'Ricardo Blanco',
//     cargo: 'Consultor de Transformación Digital',
//     empleado_area: 'Consultoría',
//     empresa: 'Consultoría Estratégica S.A.',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 30, contrato_id: 18, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-10-01', firmado: true },
//       { id: 31, contrato_id: 18, nombre: 'Otrosí Prórroga 1.pdf', tipo: 'otrosi',   fecha: '2026-02-01', firmado: true },
//     ],
//     prorrogas: makeProgs(18, [
//       { i: '2025-10-01', f: '2026-01-31', m: 4, d: 'Diagnóstico digital y hoja de ruta de transformación.' },
//       { i: '2026-02-01', f: '2026-05-31', m: 4, d: 'Implementación de herramientas de automatización y IA.' },
//     ]),
//   },

//   {
//     id: 19,
//     numero_contrato: 'CTR-2026-019',
//     empleado_id: 19,
//     nombre: 'Natalia Herrera',
//     cargo: 'Directora de Ventas',
//     empleado_area: 'Ventas',
//     empresa: 'GlobalTech Solutions',
//     request_status: 'completada',
//     documentos: [
//       { id: 32, contrato_id: 19, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2024-07-01', firmado: true },
//       { id: 33, contrato_id: 19, nombre: 'Otrosí Prórroga 4.pdf', tipo: 'otrosi',   fecha: '2025-07-01', firmado: true },
//     ],
//     prorrogas: makeProgs(19, [
//       { i: '2024-07-01', f: '2024-10-31', m: 4,  d: 'Expansión de cartera de clientes corporativos.' },
//       { i: '2024-11-01', f: '2025-02-28', m: 4,  d: 'Estrategia de ventas para mercados internacionales.' },
//       { i: '2025-03-01', f: '2025-06-30', m: 4,  d: 'Lanzamiento de canal de ventas digitales.' },
//       { i: '2025-07-01', f: '2025-10-31', m: 4,  d: 'Apertura de nuevas unidades de negocio.' },
//       { i: '2025-11-01', f: '2026-10-31', m: 12, d: 'Renovación anual — dirección comercial estratégica.' },
//     ]),
//   },

//   {
//     id: 20,
//     numero_contrato: 'CTR-2026-020',
//     empleado_id: 20,
//     nombre: 'Sebastián Mora',
//     cargo: 'Gerente de Riesgo Financiero',
//     empleado_area: 'Riesgo y Cumplimiento',
//     empresa: 'Banco Central Andino',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 34, contrato_id: 20, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2026-01-16', firmado: true },
//     ],
//     prorrogas: makeProgs(20, [
//       { i: '2026-01-16', f: '2026-05-15', m: 4, d: 'Gestión de riesgo de mercado y modelos de valoración.' },
//     ]),
//   },

//   {
//     id: 21,
//     numero_contrato: 'CTR-2026-021',
//     empleado_id: 21,
//     nombre: 'Paola Vega',
//     cargo: 'Arquitecta de Soluciones',
//     empleado_area: 'Tecnología',
//     empresa: 'Constructora Andina S.A.',
//     request_status: 'aprobada',
//     documentos: [
//       { id: 35, contrato_id: 21, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2026-01-02', firmado: true },
//     ],
//     prorrogas: makeProgs(21, [
//       { i: '2026-01-02', f: '2026-05-01', m: 4, d: 'Diseño de arquitectura cloud-native para plataforma corporativa.' },
//     ]),
//   },

//   {
//     id: 22,
//     numero_contrato: 'CTR-2026-022',
//     empleado_id: 22,
//     nombre: 'Tomás Guerrero',
//     cargo: 'Líder de QA & Testing',
//     empleado_area: 'Tecnología',
//     empresa: 'TechSolutions Perú',
//     request_status: 'completada',
//     documentos: [
//       { id: 36, contrato_id: 22, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-02-23', firmado: true },
//       { id: 37, contrato_id: 22, nombre: 'Otrosí Prórroga 4.pdf', tipo: 'otrosi',   fecha: '2026-02-23', firmado: true },
//     ],
//     prorrogas: makeProgs(22, [
//       { i: '2025-02-23', f: '2025-06-22', m: 4,  d: 'Definición de estrategia de pruebas y automatización.' },
//       { i: '2025-06-23', f: '2025-10-22', m: 4,  d: 'Implementación de pipeline de CI/CD con testing integrado.' },
//       { i: '2025-10-23', f: '2026-02-22', m: 4,  d: 'Auditoría de calidad y certificaciones ISO.' },
//       { i: '2026-02-23', f: '2026-06-22', m: 4,  d: 'Liderazgo del centro de excelencia en calidad.' },
//     ]),
//   },

//   // ══════════════════════════════════════════════════════════════════════════
//   // VENCIDO — expirado (antes de 2026-03-24)
//   // ══════════════════════════════════════════════════════════════════════════

//   {
//     id: 23,
//     numero_contrato: 'CTR-2025-023',
//     empleado_id: 23,
//     nombre: 'Alberto Cruz',
//     cargo: 'Supervisor de Almacén',
//     empleado_area: 'Logística',
//     empresa: 'Logística del Norte S.A.',
//     request_status: 'rechazada',
//     documentos: [
//       { id: 38, contrato_id: 23, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-09-16', firmado: true },
//     ],
//     prorrogas: makeProgs(23, [
//       { i: '2025-09-16', f: '2026-01-15', m: 4, d: 'Control de inventario y gestión de almacén central.' },
//     ]),
//   },

//   {
//     id: 24,
//     numero_contrato: 'CTR-2025-024',
//     empleado_id: 24,
//     nombre: 'Carmen López',
//     cargo: 'Técnica de Soporte',
//     empleado_area: 'Servicio al Cliente',
//     empresa: 'Servicios Técnicos SRL',
//     request_status: 'rechazada',
//     documentos: [
//       { id: 39, contrato_id: 24, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-11-01', firmado: true },
//     ],
//     prorrogas: makeProgs(24, [
//       { i: '2025-11-01', f: '2026-02-28', m: 4, d: 'Soporte técnico nivel 2 para clientes corporativos.' },
//     ]),
//   },

//   {
//     id: 25,
//     numero_contrato: 'CTR-2025-025',
//     empleado_id: 25,
//     nombre: 'Manuel Silva',
//     cargo: 'Auditor Interno',
//     empleado_area: 'Auditoría',
//     empresa: 'Innovatech Corp.',
//     request_status: 'completada',
//     documentos: [
//       { id: 40, contrato_id: 25, nombre: 'Contrato Original.pdf', tipo: 'contrato', fecha: '2025-11-11', firmado: true },
//       { id: 41, contrato_id: 25, nombre: 'Acta de Cierre.pdf',    tipo: 'otro',      fecha: '2026-03-10', firmado: true },
//     ],
//     prorrogas: makeProgs(25, [
//       { i: '2025-11-11', f: '2026-03-10', m: 4, d: 'Auditoría interna de procesos financieros y operativos.' },
//     ]),
//   },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // EMPLEADOS — derivados de contratos (un empleado por contrato en mock)
// // ─────────────────────────────────────────────────────────────────────────────

// export const mockEmployees: Employee[] = mockContratos.map((c) => ({
//   id: c.empleado_id ?? c.id,
//   nombre: c.nombre,
//   cargo: c.cargo,
//   area: c.empleado_area,
//   empresa: c.empresa,
// }));