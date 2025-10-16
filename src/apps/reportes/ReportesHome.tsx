import { Outlet, useNavigate } from "react-router-dom";

export default function ReportesHome() {
  const navigate = useNavigate(); // ⬅️ Hook para navegar programáticamente

  function handler() {
    console.log("Presionado");
    navigate("/reportes/53"); // ⬅️ Esto hace la navegación
  }

  return (
    <div>
      <h2>📊 Bienvenido al módulo de Reportes</h2>
      <button onClick={handler}>Ir 32</button>
      <Outlet /> {/* Aquí se renderizará ReporteDetalle cuando visites /reportes/:id */}
    </div>
  );
}
