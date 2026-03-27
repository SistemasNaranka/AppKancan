// import React from 'react';
// import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
// import { SvgIconProps } from '@mui/material';

// // ─────────────────────────────────────────────────────────────────────────────
// // Design Tokens
// // ─────────────────────────────────────────────────────────────────────────────

// const CARD_STYLES = {
//   borderRadius: '14px',
//   boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06)',
//   border: '1px solid rgba(0,0,0,0.05)',
// } as const;

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// export interface KPICardProps {
//   label: string;
//   value: number | string;
//   badge: string;
//   badgeColor: string;
//   badgeBg: string;
//   Icon: React.ComponentType<SvgIconProps>;
//   iconColor: string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Component
// // ─────────────────────────────────────────────────────────────────────────────

// const KPICard: React.FC<KPICardProps> = ({
//   label,
//   value,
//   badge,
//   badgeColor,
//   badgeBg,
//   Icon,
//   iconColor,
// }) => {
//   return (
//     <Card sx={{ ...CARD_STYLES, height: '100%', overflow: 'hidden' }}>
//       <CardContent sx={{ p: 2.5, position: 'relative' }}>
//         {/* Background icon (watermark) */}
//         <Box
//           sx={{
//             position: 'absolute',
//             bottom: -12,
//             right: -12,
//             opacity: 0.06,
//             pointerEvents: 'none',
//           }}
//         >
//           <Icon sx={{ fontSize: 110, color: iconColor }} />
//         </Box>

//         {/* Header: Icon box + Badge */}
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'flex-start',
//             mb: 1.5,
//           }}
//         >
//           <Box
//             sx={{
//               width: 40,
//               height: 40,
//               borderRadius: '10px',
//               bgcolor: badgeBg,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <Icon sx={{ fontSize: 20, color: iconColor }} />
//           </Box>
//           <Chip
//             label={badge}
//             size="small"
//             sx={{
//               fontSize: 10,
//               fontWeight: 700,
//               height: 20,
//               bgcolor: badgeBg,
//               color: badgeColor,
//             }}
//           />
//         </Box>

//         {/* Value */}
//         <Typography
//           sx={{
//             fontSize: '2.4rem',
//             fontWeight: 900,
//             lineHeight: 1,
//             color: '#0f172a',
//             mb: 0.5,
//           }}
//         >
//           {value}
//         </Typography>

//         {/* Label */}
//         <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
//           {label}
//         </Typography>
//       </CardContent>
//     </Card>
//   );
// };

// export default KPICard;
