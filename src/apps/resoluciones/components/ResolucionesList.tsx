import React from "react";
import { Resolucion } from "../types";

interface ResolucionesListProps {
  resoluciones: Resolucion[];
}

const ResolucionesList: React.FC<ResolucionesListProps> = ({
  resoluciones,
}) => {
  return (
    <div>
      <h2>Lista de Resoluciones</h2>
      <ul>
        {resoluciones.map((resolucion) => (
          <li key={resolucion.id}>
            <p>Número: {resolucion.numero}</p>
            <p>Fecha: {resolucion.fecha}</p>
            <p>Descripción: {resolucion.descripcion}</p>
            <p>Estado: {resolucion.estado}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResolucionesList;
