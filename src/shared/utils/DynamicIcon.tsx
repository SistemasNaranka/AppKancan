import React from "react";
import { SvgIconProps } from "@mui/material";

// 🧩 Importa todos los íconos usados en tus categorías y apps
import {
  Folder,
  Home,
  Apps,
  Inventory2,
  LocalShipping,
  HomeWork,
  RequestQuote,
  AccountBalance,
  Description,
  PeopleAlt,
  Badge,
  Business,
  Group,
  Summarize,
  LocalOffer,
  ShoppingCart 
} from "@mui/icons-material";

/**
 * 🗂️ Mapa de íconos permitidos.
 * Los nombres deben coincidir con los valores en la base de datos.
 * Ejemplo: icono_app = "LocalShipping", icono_categoria = "Inventory2"
 */
const ICON_MAP: Record<string, React.ElementType> = {
  // 🔸 Categoría: Inventario
  Inventory2,      
  LocalShipping,   

  // 🔸 Categoría: Principal
  HomeWork,        
  RequestQuote,    

  // 🔸 Categoría: Contabilidad
  AccountBalance, 
  Description,     
  Summarize,
  // 🔸 Categoría: Recursos Humanos
  PeopleAlt,      
  Badge,          
  Business,      
  Group,
  // 🔸 Categoría: Aplicación
  Apps,           
  Home,            

  // 🔸 Categoría: Ventas
  ShoppingCart, 
  LocalOffer,
  
  // 🔸 Fallback por si algo no coincide
  Folder,
  
};

/**
 * 🔹 DynamicIcon
 * Renderiza el ícono según el nombre recibido desde la base de datos.
 * Si no lo encuentra, muestra Folder por defecto.
 */
export const DynamicIcon = ({
  iconName,
  ...props
}: { iconName?: string } & SvgIconProps) => {
  const IconComponent =
    iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Folder;

  return <IconComponent {...props} />;
};
