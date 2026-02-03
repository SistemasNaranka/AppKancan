// // src/apps/reservas/pages/ReservasPage.tsx
// // Este es el componente principal que integra el header con las pestañas

// import React, { useState } from "react";
// import { Box } from "@mui/material";
// import ReservasHeader from "../components/ReservasHeader";
// import ReservasView, { TabReservas } from "../views/ReservasView";

// const ReservasPage: React.FC = () => {
//   const [tabActual, setTabActual] = useState<TabReservas>("todas");

//   return (
//     <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
//       {/* Header con pestañas */}
//       <ReservasHeader tabActual={tabActual} onTabChange={setTabActual} />

//       {/* Contenido */}
//       <Box sx={{ p: 3 }}>
//         <ReservasView tabActual={tabActual} onTabChange={setTabActual} />
//       </Box>
//     </Box>
//   );
// };

// export default ReservasPage;