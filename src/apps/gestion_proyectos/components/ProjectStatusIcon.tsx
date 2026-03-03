import React from 'react';
import { 
  FolderCheck, 
  FolderClock, 
  FolderKanban 
} from 'lucide-react';

type ProjectStatus = 'entregado' | 'en_proceso' | 'en_seguimiento';

interface ProjectStatusIconProps {
  status: ProjectStatus;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const ProjectStatusIcon: React.FC<ProjectStatusIconProps> = ({ 
  status,
  size = 36,
  color = '#1a73e8',
  strokeWidth = 2,
}) => {
  const iconProps = {
    size,
    color,
    strokeWidth,
  };
  
  switch (status) {
    case 'entregado':
      return <FolderCheck {...iconProps} />;
    case 'en_proceso':
      return <FolderClock {...iconProps} />;
    case 'en_seguimiento':
      return <FolderKanban {...iconProps} />;
    default:
      return null;
  }
};

export default ProjectStatusIcon;
