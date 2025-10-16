import { useState, useEffect } from "react";
interface algo {
    id: string,
    nombre: string
}
export default function Resoluciones(){
    const [lista, setLista] = useState<algo[]>([]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const data = [{id:"1",nombre:"Julio"}]
        setLista(data); // aquí ya es un array directamente
      } catch (error) {
        console.error('Error cargando productos:', error);
      }
    }
    cargarDatos();
  }, []);

  return (
    <div>
      <h1>Lista de productos</h1>
      <ul>
        {lista.map((p) => (
          <li key={p.id}>{p.nombre}</li>
        ))}
      </ul>
    </div>
  );
}