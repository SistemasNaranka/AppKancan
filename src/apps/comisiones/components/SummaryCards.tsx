import React, { useMemo, useCallback } from "react";
import { MesResumen, Role } from "../types";

import { Card as MuiCard, CardContent as MuiCardContent } from "@mui/material";

interface SummaryCardsProps {
  mesResumen: MesResumen | null;
  /** Callback para expandir/colapsar todas las tiendas */
  onToggleAllStores: () => void;
  /** Estado actual de tiendas expandidas */
  expandedTiendas: Set<string>;
  /** Filtros de rol actuales */
  filterRol: Role[];
  /** Función para obtener comisiones filtradas */
  getFilteredComissionsForCards: (mesResumen: MesResumen | null) => {
    total_comisiones: number;
    comisiones_por_rol: Record<string, number>;
  };
  /** Callback para toggle de filtro de rol */
  onRoleFilterToggle: (role: Role) => void;
  /** Callback para limpiar filtros de rol */
  onRoleFilterClear: () => void;
}

/**
 * 🚀 SummaryCards ULTRA-OPTIMIZADO con React.memo agresivo
 */

// Función de formateo memoizada
const formatCommission = (value: number): string => {
  const rounded = Math.round(value);
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Hook optimizado para datos de summary cards
const useSummaryCardsData = (
  mesResumen: MesResumen | null,
  getFilteredComissionsForCards: (mesResumen: MesResumen | null) => {
    total_comisiones: number;
    comisiones_por_rol: Record<string, number>;
  }
) => {
  return useMemo(() => {
    if (!mesResumen) {
      return {
        totalComisiones: 0,
        comisionGerente: 0,
        comisionAsesor: 0,
        comisionCajero: 0,
        comisionLogistico: 0,
      };
    }

    const filteredData = getFilteredComissionsForCards(mesResumen);
    return {
      totalComisiones: filteredData.total_comisiones,
      comisionGerente: filteredData.comisiones_por_rol.gerente,
      comisionAsesor: filteredData.comisiones_por_rol.asesor,
      comisionCajero: filteredData.comisiones_por_rol.cajero,
      comisionLogistico: filteredData.comisiones_por_rol.logistico,
    };
  }, [mesResumen, getFilteredComissionsForCards]);
};

// Componente ultra-memoizado para cada card individual
const CommissionCard = React.memo<{
  title: string;
  value: number;
  onClick: () => void;
  sx: any;
  role?: Role | "total";
  filterRol: Role[];
}>(({ title, value, onClick, sx, role, filterRol }) => {
  const isCardActive = useMemo(() => {
    if (role === "total") return false;
    return filterRol.includes(role as Role);
  }, [role, filterRol]);

  const hasFilterActive = filterRol.length > 0;

  // Memoizar el estilo de la card
  const cardStyle = useMemo(() => {
    if (role === "total") {
      return {
        background: "linear-gradient(135deg,  #3680F7 0 0%, #3680F7 100%)",
        color: "white",
        border: "2px solid #3680F7",
      };
    }

    if (isCardActive) {
      return {
        ...sx,
        boxShadow: `0 0 15px ${sx.border?.split(" ")[2]}40`,
      };
    } else if (hasFilterActive) {
      return {
        ...sx,
        opacity: 0.6,
      };
    }

    return sx;
  }, [sx, isCardActive, hasFilterActive, role]);

  return (
    <MuiCard
      onClick={onClick}
      sx={{
        ...cardStyle,
        height: { xs: "60px", md: "65px" },
        transition: "transform 0.2s ease-in-out, border 0.2s ease-in-out",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-2px)",
        },
      }}
    >
      <MuiCardContent className="p-1 md:p-2 h-full flex flex-col justify-between">
        {/* 📱 Layout para celulares y pantallas pequeñas */}
        <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
          <p className="text-xl font-semibold">{title}</p>
          <p className="text-2xl font-bold text-right tabular-nums min-w-[100px]">
            $ {formatCommission(value)}
          </p>
        </div>

        {/* 🖥 Desktop - Más compacto */}
        <div className="hidden md:flex w-full justify-end h-full">
          <div className="text-right flex flex-col justify-center h-full leading-tight">
            <div className="text-start">
              <p className="text-base font-medium opacity-90">{title}</p>
            </div>
            <p className="text-2xl font-bold">$ {formatCommission(value)}</p>
          </div>
        </div>
      </MuiCardContent>
    </MuiCard>
  );
});

CommissionCard.displayName = "CommissionCard";

// Skeleton memoizado
const SummaryCardsSkeleton = React.memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <MuiCard key={i} className="animate-pulse" sx={{ background: "#F3F4F6" }}>
        <MuiCardContent className="p-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-10 bg-gray-300 rounded w-2/3"></div>
        </MuiCardContent>
      </MuiCard>
    ))}
  </div>
));

SummaryCardsSkeleton.displayName = "SummaryCardsSkeleton";

/**
 * SummaryCards principal con optimizaciones avanzadas
 */
export const SummaryCards: React.FC<SummaryCardsProps> = React.memo(
  ({
    mesResumen,
    onToggleAllStores,
    filterRol,
    getFilteredComissionsForCards,
    onRoleFilterToggle,
    onRoleFilterClear,
  }) => {
    // Memoizar handlers para evitar re-renders
    const handleCardClick = useCallback(
      (role: Role | "total") => {
        if (role === "total") {
          onRoleFilterClear();
          onToggleAllStores();
        } else {
          onRoleFilterToggle(role);
        }
      },
      [onRoleFilterClear, onRoleFilterToggle, onToggleAllStores]
    );

    // Memoizar datos calculados
    const {
      totalComisiones,
      comisionGerente,
      comisionAsesor,
      comisionCajero,
      comisionLogistico,
    } = useSummaryCardsData(mesResumen, getFilteredComissionsForCards);

    if (!mesResumen) {
      return <SummaryCardsSkeleton />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {/* Total Comisiones */}
        <CommissionCard
          title="Total Comisiones"
          value={totalComisiones}
          onClick={() => handleCardClick("total")}
          sx={{
            background: "linear-gradient(135deg,  #3680F7 0 0%, #3680F7 100%)",
            color: "white",
            border: "2px solid #3680F7",
          }}
          role="total"
          filterRol={filterRol}
        />

        {/* Gerentes */}
        <CommissionCard
          title="Gerentes"
          value={comisionGerente}
          onClick={() => handleCardClick("gerente")}
          sx={{
            background: "linear-gradient(135deg, #7138F5 0%, #7138F5 100%)",
            color: "white",
            border: "2px solid #7138F5",
          }}
          role="gerente"
          filterRol={filterRol}
        />

        {/* Asesores */}
        <CommissionCard
          title="Asesores"
          value={comisionAsesor}
          onClick={() => handleCardClick("asesor")}
          sx={{
            background: "linear-gradient(135deg, #419061 0%, #419061 100%)",
            color: "white",
            border: "2px solid #419061",
          }}
          role="asesor"
          filterRol={filterRol}
        />

        {/* Cajeros */}
        <CommissionCard
          title="Cajeros"
          value={comisionCajero}
          onClick={() => handleCardClick("cajero")}
          sx={{
            background: "linear-gradient(135deg, #F7B036 0%, #F7B036 100%)",
            color: "white",
            border: "2px solid #F7B036",
          }}
          role="cajero"
          filterRol={filterRol}
        />

        {/* Logísticos */}
        <CommissionCard
          title="Logísticos"
          value={comisionLogistico}
          onClick={() => handleCardClick("logistico")}
          sx={{
            background: "linear-gradient(135deg, #EF4444 0%, #EF4444 100%)",
            color: "white",
            border: "2px solid #EF4444",
          }}
          role="logistico"
          filterRol={filterRol}
        />
      </div>
    );
  },
  // Comparador personalizado para evitar re-renders innecesarios
  (prevProps, nextProps) => {
    return (
      prevProps.mesResumen?.total_comisiones ===
        nextProps.mesResumen?.total_comisiones &&
      prevProps.filterRol.length === nextProps.filterRol.length &&
      prevProps.expandedTiendas.size === nextProps.expandedTiendas.size &&
      prevProps.mesResumen?.comisiones_por_rol?.gerente ===
        nextProps.mesResumen?.comisiones_por_rol?.gerente &&
      prevProps.mesResumen?.comisiones_por_rol?.asesor ===
        nextProps.mesResumen?.comisiones_por_rol?.asesor &&
      prevProps.mesResumen?.comisiones_por_rol?.cajero ===
        nextProps.mesResumen?.comisiones_por_rol?.cajero &&
      prevProps.mesResumen?.comisiones_por_rol?.logistico ===
        nextProps.mesResumen?.comisiones_por_rol?.logistico
    );
  }
);

SummaryCards.displayName = "SummaryCards";
