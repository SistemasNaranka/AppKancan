import * as Icons from "@mui/icons-material";
import { SvgIconProps } from "@mui/material";
import { Folder } from "@mui/icons-material";

interface DynamicIconProps extends SvgIconProps {
iconName?: string;
color?: 'inherit' | 'action' | 'disabled' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export function DynamicIcon({ iconName, color = "inherit", ...props }: DynamicIconProps) {
// Si no viene nombre, usar Folder
if (!iconName) return <Folder color={color as any} {...props} />;

// 🔹 Buscar el icono dentro del objeto de íconos de MUI
const IconComponent = (Icons as Record<string, React.ElementType>)[iconName];

if (!IconComponent) {
console.warn('⚠️ Icono"${iconName}" no encontrado, usando Folder');
return <Folder color={color as any} {...props} />;
}

return <IconComponent color={color as any} {...props} />;
}