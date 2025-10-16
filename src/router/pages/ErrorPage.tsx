// Declara tipado de las propiedades del ErrorPage
interface ErrorPageProps {
  error: unknown; // puede venir de un try/catch, así que no siempre será un Error
}
// Declarando el componente ErrorPage
export default function ErrorPage({ error }: ErrorPageProps) {
  // Declarar message
  // Si message es una instancia de Error, tomara el valor de error.message, en caso contrario lo convertira en string y si esta vacio Error desconocido
  const message =
    error instanceof Error ? error.message : String(error ?? "Error desconocido");
  // Retornar renderizado mostrando el motivo del error
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "monospace",
        backgroundColor: "#1e1e1e",
        color: "#ff6b6b",
        minHeight: "100vh",
      }}
    >
      <h1>🚨 Error en configuración de rutas</h1>
      <pre
        style={{
          backgroundColor: "#2d2d2d",
          padding: "1rem",
          borderRadius: "8px",
          overflow: "auto",
        }}
      >
        {message}
      </pre>
      <p style={{ marginTop: "1rem", color: "#feca57" }}>
        ⚠️ Revisa la consola del navegador (F12) para ver los detalles completos.
      </p>
    </div>
  );
}
