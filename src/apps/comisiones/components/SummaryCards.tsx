import React from "react";
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

const formatCommission = (value: number): string => {
  const rounded = Math.round(value);
  // Format with comma thousands separators
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  mesResumen,
  onToggleAllStores,

  filterRol,
  getFilteredComissionsForCards,
  onRoleFilterToggle,
  onRoleFilterClear,
}) => {
  if (!mesResumen) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <MuiCard
            key={i}
            className="animate-pulse"
            sx={{ background: "#F3F4F6" }}
          >
            <MuiCardContent className="p-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="h-10 bg-gray-300 rounded w-2/3"></div>
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>
    );
  }

  // Obtener las comisiones filtradas usando la nueva función
  const filteredData = getFilteredComissionsForCards(mesResumen);
  const totalComisiones = filteredData.total_comisiones;
  const comisionGerente = filteredData.comisiones_por_rol.gerente;
  const comisionAsesor = filteredData.comisiones_por_rol.asesor;
  const comisionCajero = filteredData.comisiones_por_rol.cajero;
  const comisionLogistico = filteredData.comisiones_por_rol.logistico;

  // Función para manejar clicks en las cards
  const handleCardClick = (role: Role | "total") => {
    if (role === "total") {
      // Total Comisiones: resetear filtros y toggle de tiendas
      onRoleFilterClear(); // Limpiar todos los filtros de rol
      onToggleAllStores();
    } else {
      // Cards de rol: toggle del filtro de rol
      onRoleFilterToggle(role);
      onToggleAllStores();
    }
  };

  // Función para determinar si una card está activa (seleccionada)
  const isCardActive = (rol: Role | "total"): boolean => {
    if (rol === "total") return false; // Total nunca está activo
    return filterRol.includes(rol as Role);
  };

  // Función para obtener el estilo de la card basado en si está activa
  const getCardStyle = (
    rol: Role | "total",
    normalColor: string,
    activeColor: string
  ) => {
    const isActive = isCardActive(rol);
    const hasFilterActive = filterRol.length > 0;

    // Extraer el color sólido del gradient
    const extractColorFromGradient = (gradient: string) => {
      const match = gradient.match(/#[0-9A-Fa-f]{6}/);
      return match ? match[0] : "#3680F7";
    };

    const solidColor = extractColorFromGradient(normalColor);

    if (rol === "total") {
      // Total comisiones siempre mantiene su estilo normal
      return {
        background: "linear-gradient(135deg,  #3680F7 0 0%, #3680F7 100%)",
        color: "white",
        border: "2px solid #3680F7",
      };
    }

    if (isActive) {
      // Card activa: color normal con borde del mismo color
      return {
        background: normalColor,
        color: "white",
        border: `2px solid ${solidColor}`, // Borde del mismo color de la card
        boxShadow: `0 0 15px ${solidColor}40`,
      };
    } else if (hasFilterActive) {
      // Card inactiva cuando hay un filtro activo: menos opacity
      return {
        background: normalColor,
        color: "white",
        border: `2px solid ${solidColor}`, // Borde del mismo color de la card
        opacity: 0.6,
      };
    } else {
      // Sin filtro activo: borde del mismo color de la card
      return {
        background: normalColor,
        color: "white",
        border: `2px solid ${solidColor}`, // Borde del mismo color de la card
      };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <MuiCard
        onClick={() => handleCardClick("total")}
        sx={{
          background: "linear-gradient(135deg,  #3680F7 0 0%, #3680F7 100%)",
          color: "white",
          border: "2px solid #3680F7",
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
            <p className="text-xl font-semibold">Total Comisiones</p>
            <p className="text-2xl font-bold text-right tabular-nums min-w-[100px]">
              $ {formatCommission(totalComisiones)}
            </p>
          </div>

          {/* 🖥 Desktop - Más compacto */}
          <div className="hidden md:flex w-full justify-end h-full">
            <div className="text-right flex flex-col justify-center h-full leading-tight">
              <div className="text-start">
                <p className="text-base font-medium opacity-90">
                  Total Comisiones
                </p>
              </div>
              <p className="text-2xl  font-bold">
                $ {formatCommission(totalComisiones)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Gerentes - SIEMPRE visible */}
      <MuiCard
        onClick={() => handleCardClick("gerente")}
        sx={{
          ...getCardStyle(
            "gerente",
            "linear-gradient(135deg, #7138F5 0%, #7138F5 100%)",
            "linear-gradient(135deg, #7138F5 0%, #7138F5 100%)"
          ),
          height: { xs: "60px", md: "65px" },
          transition: "transform 0.2s ease-in-out, border 0.2s ease-in-out",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-1 md:p-2 h-full flex flex-col justify-between">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-medium">Gerentes</p>
            <p className="text-2xl font-bold text-right min-w-[100px]">
              $ {formatCommission(comisionGerente)}
            </p>
          </div>

          {/* 🖥 Desktop - Más compacto */}
          <div className="hidden md:flex w-full justify-end h-full">
            <div className="text-right flex flex-col justify-center h-full leading-tight">
              <div className="text-start">
                <p className="text-base font-medium ">Gerentes</p>
              </div>
              <p className="text-2xl  font-bold">
                $ {formatCommission(comisionGerente)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Asesores - SIEMPRE visible */}
      <MuiCard
        onClick={() => handleCardClick("asesor")}
        sx={{
          ...getCardStyle(
            "asesor",
            "linear-gradient(135deg, #419061 0%, #419061 100%)",
            "linear-gradient(135deg, #419061 0%, #419061 100%)"
          ),
          height: { xs: "60px", md: "65px" },
          transition: "transform 0.2s ease-in-out, border 0.2s ease-in-out",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-1 md:p-2 h-full flex flex-col justify-between">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Asesores</p>
            <p className="text-2xl font-bold text-right min-w-[100px]">
              $ {formatCommission(comisionAsesor)}
            </p>
          </div>

          {/* 🖥 Desktop - Más compacto */}
          <div className="hidden md:flex w-full justify-end h-full">
            <div className="text-right flex flex-col justify-center h-full leading-tight">
              <div className="text-start">
                <p className="text-base font-medium">Asesores</p>
              </div>
              <p className="text-2xl  font-bold">
                $ {formatCommission(comisionAsesor)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Cajeros - SIEMPRE visible */}
      <MuiCard
        onClick={() => handleCardClick("cajero")}
        sx={{
          ...getCardStyle(
            "cajero",
            "linear-gradient(135deg, #F7B036 0%, #F7B036 100%)",
            "linear-gradient(135deg, #F7B036 0%, #F7B036 100%)"
          ),
          height: { xs: "60px", md: "65px" },
          transition: "transform 0.2s ease-in-out, border 0.2s ease-in-out",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-1 md:p-2 h-full flex flex-col justify-between">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Cajeros</p>
            <p className="text-2xl font-bold text-right min-w-[100px]">
              $ {formatCommission(comisionCajero)}
            </p>
          </div>

          {/* 🖥 Desktop - Más compacto */}
          <div className="hidden md:flex w-full justify-end h-full">
            <div className="text-right flex flex-col justify-center h-full leading-tight">
              <div className="text-start">
                <p className="text-base font-medium">Cajeros</p>
              </div>
              <p className="text-2xl  font-bold">
                $ {formatCommission(comisionCajero)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Logísticos - SIEMPRE visible */}
      <MuiCard
        onClick={() => handleCardClick("logistico")}
        sx={{
          ...getCardStyle(
            "logistico",
            "linear-gradient(135deg, #EF4444 0%, #EF4444 100%)",
            "linear-gradient(135deg, #EF4444 0%, #EF4444 100%)"
          ),
          height: { xs: "60px", md: "65px" },
          transition: "transform 0.2s ease-in-out, border 0.2s ease-in-out",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-1 md:p-2 h-full flex flex-col justify-between">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Logísticos</p>
            <p className="text-2xl font-bold text-right min-w-[100px]">
              $ {formatCommission(comisionLogistico)}
            </p>
          </div>

          {/* 🖥 Desktop - Más compacto */}
          <div className="hidden md:flex w-full justify-end h-full">
            <div className="text-right flex flex-col justify-center h-full leading-tight">
              <div className="text-start">
                <p className="text- font-medium opacity-90">Logísticos</p>
              </div>
              <p className="text-2xl  font-bold">
                $ {formatCommission(comisionLogistico)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>
    </div>
  );
};
