// // src/apps/reservas/components/ReservasHeader.tsx
// // Este componente se integra en tu header/navbar principal

// import React from "react";
// import { Box, Typography } from "@mui/material";
// import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
// import type { TabReservas } from "../views/ReservasView";

// interface ReservasHeaderProps {
//   tabActual: TabReservas;
//   onTabChange: (tab: TabReservas) => void;
// }

// const ReservasHeader: React.FC<ReservasHeaderProps> = ({ tabActual, onTabChange }) => {
//   const tabs: { id: TabReservas; label: string }[] = [
//     { id: "todas", label: "Todas las reservas" },
//     { id: "mis", label: "Mis reservas" },
//     { id: "calendario", label: "Vista calendario" },
//   ];

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         alignItems: "center",
//         gap: 4,
//         py: 2,
//         px: 3,
//         backgroundColor: "white",
//         borderBottom: "1px solid #e0e0e0",
//       }}
//     >
//       {/* Logo y título */}
//       <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//         <Box
//           sx={{
//             width: 40,
//             height: 40,
//             borderRadius: 2,
//             backgroundColor: "#1976d2",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <CalendarIcon sx={{ color: "white" }} />
//         </Box>
//         <Box>
//           <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
//             Reservas de Salas
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             Sistema interno
//           </Typography>
//         </Box>
//       </Box>

//       {/* Pestañas de navegación */}
//       <Box sx={{ display: "flex", gap: 1 }}>
//         {tabs.map((tab) => (
//           <Box
//             key={tab.id}
//             onClick={() => onTabChange(tab.id)}
//             sx={{
//               px: 2,
//               py: 1,
//               cursor: "pointer",
//               borderRadius: 1,
//               fontWeight: tabActual === tab.id ? 600 : 400,
//               color: tabActual === tab.id ? "#1976d2" : "#6b7280",
//               borderBottom: tabActual === tab.id ? "2px solid #1976d2" : "2px solid transparent",
//               transition: "all 0.2s",
//               "&:hover": {
//                 color: "#1976d2",
//                 backgroundColor: "rgba(25, 118, 210, 0.04)",
//               },
//             }}
//           >
//             <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
//               {tab.label}
//             </Typography>
//           </Box>
//         ))}
//       </Box>
//     </Box>
//   );
// };

// export default ReservasHeader;