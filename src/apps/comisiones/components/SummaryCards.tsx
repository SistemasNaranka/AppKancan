import React from "react";
import { MesResumen } from "../types";

import { Card as MuiCard, CardContent as MuiCardContent } from "@mui/material";

interface SummaryCardsProps {
  mesResumen: MesResumen | null;
}

const formatCommission = (value: number): string => {
  const rounded = Math.round(value);
  // Format with comma thousands separators
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ mesResumen }) => {
  if (!mesResumen) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
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

  const totalComisiones = mesResumen.total_comisiones;
  const comisionGerente = mesResumen.comisiones_por_rol.gerente;
  const comisionAsesor = mesResumen.comisiones_por_rol.asesor;
  const comisionCajero = mesResumen.comisiones_por_rol.cajero;
  const comisionLogistico = mesResumen.comisiones_por_rol.logistico;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <MuiCard
        sx={{
          background: "linear-gradient(135deg,  #3680F7 0 0%, #3680F7 100%)",
          color: "white",
          border: "2px solid #3680F7",
          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-4">
          {/* 📱 Layout para celulares y pantallas pequeñas */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Total Comisiones</p>
            <p className="text-2xl font-bold text-right tabular-nums min-w-[140px]">
              $ {formatCommission(totalComisiones)}
            </p>
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:flex w-full justify-end">
            <div className="text-right">
              <div className="text-start">
                <p className="text-base font-medium opacity-90">
                  Total Comisiones
                </p>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mt-2">
                $ {formatCommission(totalComisiones)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard
        sx={{
          background: "linear-gradient(135deg, #7138F5  0%, #7138F5 100%)",
          color: "white",
          border: "2px solid #7138F5",

          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-4">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-medium">Gerentes</p>
            <p className="text-2xl font-bold text-right min-w-[140px]">
              $ {formatCommission(comisionGerente)}
            </p>
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:flex w-full justify-end">
            <div className="text-right">
              <div className="text-start">
                <p className="text-base font-medium ">Gerentes</p>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mt-2">
                $ {formatCommission(comisionGerente)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard
        sx={{
          background: "linear-gradient(135deg,  #419061 0%,   #419061 100%)",
          color: "white",
          border: "2px solid  #419061",
          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-4">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Asesores</p>
            <p className="text-2xl font-bold text-right min-w-[140px]">
              $ {formatCommission(comisionAsesor)}
            </p>
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:flex w-full justify-end">
            <div className="text-right">
              <div className="text-start">
                <p className="text-base font-medium">Asesores</p>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mt-2">
                $ {formatCommission(comisionAsesor)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard
        sx={{
          background: "linear-gradient(135deg, #F7B036  0%, #F7B036 100%)",
          color: "white",
          border: "2px solid #F7B036",

          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-4">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Cajeros</p>
            <p className="text-2xl font-bold text-right min-w-[140px]">
              $ {formatCommission(comisionCajero)}
            </p>
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:flex w-full justify-end">
            <div className="text-right">
              <div className="text-start">
                <p className="text-base font-medium">Cajeros</p>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mt-2">
                $ {formatCommission(comisionCajero)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      <MuiCard
        sx={{
          background: "linear-gradient(135deg, #EF4444  0%, #EF4444 100%)",
          color: "white",
          border: "2px solid #EF4444",

          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <MuiCardContent className="p-4">
          {/* 📱 Mobile */}
          <div className="grid grid-cols-[1fr_auto] items-center md:hidden">
            <p className="text-xl font-semibold">Logísticos</p>
            <p className="text-2xl font-bold text-right min-w-[140px]">
              $ {formatCommission(comisionLogistico)}
            </p>
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:flex w-full justify-end">
            <div className="text-right">
              <div className="text-base">
                <p className="text-sm font-medium opacity-90">Logísticos</p>
              </div>
              <p className="text-2xl lg:text-3xl font-bold mt-2">
                $ {formatCommission(comisionLogistico)}
              </p>
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>
    </div>
  );
};
