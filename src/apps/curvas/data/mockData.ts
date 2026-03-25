import type { 
  DatosCurvas, 
  MatrizGeneralCurvas, 
  DetalleProducto,
  Tienda 
} from '../types';

/**
 * Datos de prueba para el desarrollo del módulo de curvas
 */

const tiendasMock: Tienda[] = [
  { id: '1', codigo: '001', nombre: 'Tienda Centro', region: 'Norte', ciudad: 'Bogotá' },
  { id: '2', codigo: '002', nombre: 'Tienda Norte', region: 'Norte', ciudad: 'Bogotá' },
  { id: '3', codigo: '003', nombre: 'Tienda Sur', region: 'Sur', ciudad: 'Bogotá' },
  { id: '4', codigo: '004', nombre: 'Tienda Este', region: 'Este', ciudad: 'Medellín' },
  { id: '5', codigo: '005', nombre: 'Tienda Oeste', region: 'Oeste', ciudad: 'Cali' },
  { id: '6', codigo: '006', nombre: 'Tienda Plaza', region: 'Central', ciudad: 'Bogotá' },
  { id: '7', codigo: '007', nombre: 'Tienda VIP', region: 'Norte', ciudad: 'Bogotá' },
];

export const mockMatrizGeneral: MatrizGeneralCurvas = {
  referencia: 'REF: 16609',
  curvas: ['01', '03', '05', '07', '09', '11', '13'],
  filas: tiendasMock.map((tienda) => {
    const curvasData: Record<string, { valor: number; esCero: boolean; esMayorQueCero: boolean }> = {};
    let total = 0;
    
    ['01', '03', '05', '07', '09', '11', '13'].forEach((curva) => {
      const valor = Math.floor(Math.random() * 80);
      curvasData[curva] = {
        valor,
        esCero: valor === 0,
        esMayorQueCero: valor > 0,
      };
      total += valor;
    });

    return { tienda, curvas: curvasData, total };
  }),
  totalesPorCurva: {
    '01': 245,
    '03': 312,
    '05': 189,
    '07': 156,
    '09': 98,
    '11': 67,
    '13': 34,
  },
  totalGeneral: 1101,
};

export const mockDetalleProductoA: DetalleProducto = {
  metadatos: {
    referencia: 'REF: 16609',
    imagen: 'https://via.placeholder.com/200/000000/FFFFFF?text=Zapato+A',
    color: 'Negro',
    proveedor: 'Proveedor Principal S.A.S',
    precio: 89990,
    linea: 'Calzado',
    categoria: 'Zapatos Formales',
  },
  tallas: ['35', '36', '37', '38', '39', '40', '41', '42'],
  filas: tiendasMock.map((tienda) => {
    const tallasData: Record<string, { valor: number; esCero: boolean; esMayorQueCero: boolean }> = {};
    let total = 0;
    
    ['35', '36', '37', '38', '39', '40', '41', '42'].forEach((talla) => {
      const valor = Math.random() > 0.2 ? Math.floor(Math.random() * 15) : 0;
      tallasData[talla] = {
        valor,
        esCero: valor === 0,
        esMayorQueCero: valor > 0,
      };
      total += valor;
    });

    return { tienda, tallas: tallasData, total };
  }),
  totalesPorTalla: {
    '35': 23,
    '36': 45,
    '37': 67,
    '38': 89,
    '39': 78,
    '40': 56,
    '41': 34,
    '42': 12,
  },
  totalGeneral: 404,
};

export const mockDetalleProductoB: DetalleProducto = {
  metadatos: {
    referencia: 'REF: 16610',
    imagen: 'https://via.placeholder.com/200/0000FF/FFFFFF?text=Zapato+B',
    color: 'Azul Marino',
    proveedor: 'Proveedor Principal S.A.S',
    precio: 94990,
    linea: 'Calzado',
    categoria: 'Zapatos Deportivos',
  },
  tallas: ['35', '36', '37', '38', '39', '40', '41', '42'],
  filas: tiendasMock.map((tienda) => {
    const tallasData: Record<string, { valor: number; esCero: boolean; esMayorQueCero: boolean }> = {};
    let total = 0;
    
    ['35', '36', '37', '38', '39', '40', '41', '42'].forEach((talla) => {
      const valor = Math.random() > 0.25 ? Math.floor(Math.random() * 12) : 0;
      tallasData[talla] = {
        valor,
        esCero: valor === 0,
        esMayorQueCero: valor > 0,
      };
      total += valor;
    });

    return { tienda, tallas: tallasData, total };
  }),
  totalesPorTalla: {
    '35': 18,
    '36': 38,
    '57': 55,
    '38': 72,
    '39': 65,
    '40': 48,
    '41': 28,
    '42': 15,
  },
  totalGeneral: 339,
};

export const mockDatosCurvas: DatosCurvas = {
  matrizGeneral: mockMatrizGeneral,
  productoA: mockDetalleProductoA,
  productoB: mockDetalleProductoB,
  fechaCarga: new Date(),
};

export default mockDatosCurvas;
