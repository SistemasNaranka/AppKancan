// Icono y color por tipo de novedad, reutilizable en las vistas de horarios.
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GavelIcon from '@mui/icons-material/Gavel';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AssignmentIcon from '@mui/icons-material/Assignment';

export const getIconForTipo = (tipo: any) => {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('descanso')) return <FreeBreakfastIcon fontSize="small" sx={{ color: '#0284c7' }} />;
  if (t.includes('ausencia')) return <BlockIcon fontSize="small" sx={{ color: '#ca8a04' }} />;
  if (t.includes('calamidad')) return <WarningIcon fontSize="small" sx={{ color: '#dc2626' }} />;
  if (t.includes('capacitaci')) return <SchoolIcon fontSize="small" sx={{ color: '#3b82f6' }} />;
  if (t.includes('familia')) return <FamilyRestroomIcon fontSize="small" sx={{ color: '#8b5cf6' }} />;
  if (t.includes('incapacidad')) return <HealthAndSafetyIcon fontSize="small" sx={{ color: '#16a34a' }} />;
  if (t.includes('permiso')) return <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#f59e0b' }} />;
  if (t.includes('retiro')) return <ExitToAppIcon fontSize="small" sx={{ color: '#6b7280' }} />;
  if (t.includes('suspensi')) return <GavelIcon fontSize="small" sx={{ color: '#991b1b' }} />;
  if (t.includes('vacaciones')) return <BeachAccessIcon fontSize="small" sx={{ color: '#0ea5e9' }} />;
  return <AssignmentIcon fontSize="small" sx={{ color: '#64748b' }} />;
};

export const getChipColor = (tipo: any, esReporte?: boolean): { bg: string; text: string } => {
  const t = String(tipo || '').toLowerCase();
  if (esReporte) {
    if (t.includes('descanso')) return { bg: 'rgba(2, 132, 199, 0.06)', text: 'rgba(2, 132, 199, 0.8)' };
    if (t.includes('ausencia')) return { bg: 'rgba(202, 138, 4, 0.06)', text: 'rgba(202, 138, 4, 0.8)' };
    if (t.includes('calamidad')) return { bg: 'rgba(220, 38, 38, 0.06)', text: 'rgba(220, 38, 38, 0.8)' };
    if (t.includes('capacitaci')) return { bg: 'rgba(59, 130, 246, 0.06)', text: 'rgba(59, 130, 246, 0.8)' };
    if (t.includes('familia')) return { bg: 'rgba(139, 92, 246, 0.06)', text: 'rgba(139, 92, 246, 0.8)' };
    if (t.includes('incapacidad')) return { bg: 'rgba(22, 163, 74, 0.06)', text: 'rgba(22, 163, 74, 0.8)' };
    if (t.includes('permiso')) return { bg: 'rgba(245, 158, 11, 0.06)', text: 'rgba(245, 158, 11, 0.8)' };
    if (t.includes('retiro')) return { bg: 'rgba(107, 114, 128, 0.06)', text: 'rgba(107, 114, 128, 0.8)' };
    if (t.includes('suspensi')) return { bg: 'rgba(153, 27, 27, 0.06)', text: 'rgba(153, 27, 27, 0.8)' };
    if (t.includes('vacaciones')) return { bg: 'rgba(14, 165, 233, 0.06)', text: 'rgba(14, 165, 233, 0.8)' };
    return { bg: 'rgba(100, 116, 139, 0.06)', text: 'rgba(100, 116, 139, 0.8)' };
  } else {
    if (t.includes('descanso')) return { bg: '#e0f2fe', text: '#0284c7' };
    if (t.includes('ausencia')) return { bg: '#fef9c3', text: '#ca8a04' };
    if (t.includes('calamidad')) return { bg: '#fee2e2', text: '#dc2626' };
    if (t.includes('capacitaci')) return { bg: '#dbeafe', text: '#3b82f6' };
    if (t.includes('familia')) return { bg: '#ede9fe', text: '#8b5cf6' };
    if (t.includes('incapacidad')) return { bg: '#dcfce7', text: '#16a34a' };
    if (t.includes('permiso')) return { bg: '#fef3c7', text: '#f59e0b' };
    if (t.includes('retiro')) return { bg: '#f3f4f6', text: '#6b7280' };
    if (t.includes('suspensi')) return { bg: '#fecaca', text: '#991b1b' };
    if (t.includes('vacaciones')) return { bg: '#e0f2fe', text: '#0ea5e9' };
    return { bg: '#f8fafc', text: '#64748b' };
  }
};
