export interface Articulo {
  referencia: string;
  cantidad: number;
}

export interface ArticuloData {
  bodega: number;
  articulos: Articulo[];
}
