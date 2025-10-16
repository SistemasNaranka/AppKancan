import { useParams } from "react-router-dom";

export default function ReporteDetalle() {
  const { id } = useParams();
  return <h3>Detalle del reporte con ID: {id}</h3>;
}