import { BudgetRecord, StaffMember, MonthConfig, VentasData } from '../types';

// Datos de ejemplo para presupuestos
export const demoBudgets: BudgetRecord[] = [
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 216000000,
    presupuesto_gerente: 216000000,
    presupuesto_asesores: 0
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 1260000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 126000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 324000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 324000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 1980000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 198000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 5760000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 5760000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 7740000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 7740000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 90000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 90000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 4500000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 450000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 4500000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 4500000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 7560000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 7560000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 504000000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 504000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 360000,
    presupuesto_gerente: 0,
    presupuesto_asesores: 3600000000
  },
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    presupuesto_total: 0,
    presupuesto_gerente: 0,
    presupuesto_asesores: 0
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 106585312,
    presupuesto_gerente: 0,
    presupuesto_asesores: 106585312
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 117128320,
    presupuesto_gerente: 0,
    presupuesto_asesores: 117128320
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 53177800,
    presupuesto_gerente: 53177800,
    presupuesto_asesores: 0
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 107071548,
    presupuesto_gerente: 0,
    presupuesto_asesores: 107071548
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 114744136,
    presupuesto_gerente: 0,
    presupuesto_asesores: 114744136
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 892680,
    presupuesto_gerente: 0,
    presupuesto_asesores: 892680
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    presupuesto_total: 0,
    presupuesto_gerente: 0,
    presupuesto_asesores: 0
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 142924998,
    presupuesto_gerente: 0,
    presupuesto_asesores: 142924998
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 124997676,
    presupuesto_gerente: 0,
    presupuesto_asesores: 124997676
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 146589441,
    presupuesto_gerente: 0,
    presupuesto_asesores: 146589441
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 43799535,
    presupuesto_gerente: 43799535,
    presupuesto_asesores: 0
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 12249021,
    presupuesto_gerente: 0,
    presupuesto_asesores: 12249021
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 47989155,
    presupuesto_gerente: 0,
    presupuesto_asesores: 47989155
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    presupuesto_total: 0,
    presupuesto_gerente: 0,
    presupuesto_asesores: 0
  }
];

// Datos de ejemplo para personal
export const demoStaff: StaffMember[] = [
  {
    id: '159',
    nombre: 'PAULA ANDREA VIAFARA',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'gerente'
  },
  {
    id: '669',
    nombre: 'MARTHAT DAZA',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '1523',
    nombre: 'KELLY TATIANA CAICEDOU',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2104',
    nombre: 'JHOSELIN ANDREA MERCADO',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2152',
    nombre: 'EDILIO OSORIO PIZARRO',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2192',
    nombre: 'NICOL VELASCO',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2341',
    nombre: 'MARY ORTIZ',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2380',
    nombre: 'MARIA DEL PILAR VIEDMAN',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2398',
    nombre: 'MAYRA ESCOBAR MONTANO',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2458',
    nombre: 'ISABELLA MEDINA',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2478',
    nombre: 'LAURA VANESSA TROCHEZ',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '7',
    nombre: 'CAJERO UNICO CALI',
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    rol: 'cajero'
  },
  {
    id: '546',
    nombre: 'ANGELA DAYANA BASTIDAS',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '1742',
    nombre: 'LUZ DABELLY GALLARDO',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2351',
    nombre: 'MARA FERNANDA MARTINEZ',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'gerente'
  },
  {
    id: '2356',
    nombre: 'LEIDY COLLANTES',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2364',
    nombre: 'JENNY ALEXANDRA GMEZ',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2375',
    nombre: 'ANGELA MARIA MORALES',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '12',
    nombre: 'CAJERO BUGA CENTRO',
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    rol: 'cajero'
  },
  {
    id: '1355',
    nombre: 'ELIANA MORENO',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '1800',
    nombre: 'YULIE VALENTINA MEDINA',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '1951',
    nombre: 'SANDRA LUCELLY PEREZ',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2068',
    nombre: 'ZULLY TATIANA PENA',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'gerente'
  },
  {
    id: '2466',
    nombre: 'HILDE DORALIS TERAN',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '2471',
    nombre: 'PAULA LOPEZ',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'asesor'
  },
  {
    id: '24',
    nombre: 'CAJERO CAMPANARIO',
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    rol: 'cajero'
  }
];

// Configuración de mes
export const demoMonthConfigs: MonthConfig[] = [
 {
    mes: 'Sep 2025',
    porcentaje_gerente: 10
  }
];

// Datos de ventas
export const demoVentas: VentasData[] = [
  {
    tienda: '007-UNICO CALI',
    fecha: '2025-09-01',
    ventas_tienda: 215247105,
    ventas_por_asesor: {
      '159': 970535,
      '669': 6198000,
      '1523': 1620855,
      '2104': 10351430,
      '2152': 29076500,
      '2192': 39101750,
      '2341': 46451480,
      '2380': 22296375,
      '2398': 39052565,
      '2458': 2414100,
      '2478': 18175325,
      '7': 0
    }
  },
  {
    tienda: '012-BUGA CENTRO',
    fecha: '2025-09-01',
    ventas_tienda: 149998290,
    ventas_por_asesor: {
      '546': 23441500,
      '1742': 42350830,
      '2351': 336250,
      '2356': 34844475,
      '2364': 27734965,
      '2375': 21459550,
      '12': 0
    }
  },
  {
    tienda: '024-CAMPANARIO',
    fecha: '2025-09-01',
    ventas_tienda: 166385530,
    ventas_por_asesor: {
      '1355': 50543050,
      '1800': 51874430,
      '1951': 49373350,
      '2068': 0,
      '2466': 2978200,
      '2471': 11565450,
      '24': 0
    }
  }
];
