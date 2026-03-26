import React from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import { TabValue } from '../types/types';
import { useContracts } from '../hooks/useContracts';

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface TabConfig {
  value: TabValue;
  label: string;
  Icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { value: 'resumen',     label: 'Resumen',     Icon: DashboardOutlinedIcon },
  { value: 'pendiente',   label: 'Contratos',  Icon: PendingActionsOutlinedIcon },
  { value: 'en_revision', label: 'Empleados', Icon: GroupsIcon },
  //{ value: 'aprobada',    label: 'Aprobadas',   Icon: CheckCircleOutlineIcon },
];

// ─────────────────────────────────────────────────────────────────────────────
// TabsNav
// ─────────────────────────────────────────────────────────────────────────────

const TabsNav: React.FC = () => {
  const { filters, setTab, counts } = useContracts();

  const badgeFor = (value: TabValue): number | undefined => {
    if (value === 'pendiente')   return counts.pendiente   || undefined;
    if (value === 'en_revision') return counts.en_revision || undefined;
    if (value === 'rechazada')   return counts.rechazada   || undefined;
    return undefined;
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 3,
      }}
    >
      <Tabs
        value={filters.tab}
        onChange={(_, v: TabValue) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={{ style: { display: 'none' } }}
        sx={{
          minHeight: 52,
          '& .MuiTabs-flexContainer': { gap: 0.5, alignItems: 'center', height: 52 },
        }}
      >
        {TABS.map(({ value, label, Icon }) => {
          const badge = badgeFor(value);
          const isActive = filters.tab === value;

          return (
            <Tab
              key={value}
              value={value}
              disableRipple
              icon={<Icon style={{ fontSize: 15 }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  {label}
                  {badge !== undefined && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        px: 0.8,
                        py: 0.3,
                        borderRadius: 10,
                        bgcolor: isActive ? 'rgba(255,255,255,0.25)' : 'warning.main',
                        color: isActive ? '#fff' : '#fff',
                      }}
                    >
                      {badge}
                    </Box>
                  )}
                </Box>
              }
              sx={{
                minHeight: 36,
                py: 0.75,
                px: 1.8,
                borderRadius: 2,
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                textTransform: 'none',
                letterSpacing: 0,
                color: isActive ? '#fff' : 'text.secondary',
                bgcolor: isActive ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? 'primary.dark' : 'action.hover',
                },
                transition: 'all 0.2s ease',
                '& .MuiTab-iconWrapper': {
                  color: isActive ? 'rgba(255,255,255,0.85)' : 'text.disabled',
                  mr: 0.5,
                },
                '&.Mui-selected': {
                  color: '#fff',
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default TabsNav;