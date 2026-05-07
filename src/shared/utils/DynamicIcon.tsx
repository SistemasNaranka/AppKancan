import React from "react";
import { SvgIconProps } from "@mui/material";

// 🧩 Importa todos los íconos usados en tus categorías y apps
import Folder from '@mui/icons-material/Folder';
import Home from '@mui/icons-material/Home';
import Apps from '@mui/icons-material/Apps';
import Inventory2 from '@mui/icons-material/Inventory2';
import LocalShipping from '@mui/icons-material/LocalShipping';
import HomeWork from '@mui/icons-material/HomeWork';
import RequestQuote from '@mui/icons-material/RequestQuote';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Description from '@mui/icons-material/Description';
import PeopleAlt from '@mui/icons-material/PeopleAlt';
import Badge from '@mui/icons-material/Badge';
import Business from '@mui/icons-material/Business';
import Group from '@mui/icons-material/Group';
import Summarize from '@mui/icons-material/Summarize';
import LocalOffer from '@mui/icons-material/LocalOffer';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import DocumentScanner from '@mui/icons-material/DocumentScanner';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import LocalAtm from '@mui/icons-material/LocalAtm';
import CurrencyExchange from '@mui/icons-material/CurrencyExchange';
import Assignment from '@mui/icons-material/Assignment';
import Calculate from '@mui/icons-material/Calculate';
import Difference from '@mui/icons-material/Difference';
import EditCalendar from '@mui/icons-material/EditCalendar';
import GridView from '@mui/icons-material/GridView';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import ShoppingBag from '@mui/icons-material/ShoppingBag';
import SettingsSuggest from '@mui/icons-material/SettingsSuggest';
import DataObject from '@mui/icons-material/DataObject';
import Warehouse from '@mui/icons-material/Warehouse';
import WorkspacePremium from '@mui/icons-material/WorkspacePremium';
import PendingActions from '@mui/icons-material/PendingActions';
import Diversity1 from '@mui/icons-material/Diversity1';
import BackupTable from '@mui/icons-material/BackupTable';
import ContactPhone from '@mui/icons-material/ContactPhone';
/**
 * Mapa de íconos permitidos.
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
  Calculate,
  Summarize,
  Difference,
  Assignment,
  ReceiptLong,
  // 🔸 Categoría: Recursos Humanos
  PeopleAlt,
  Badge,
  Business,
  Group,
  EditCalendar,
  PendingActions,
  Diversity1,
  // 🔸 Categoría: Aplicación
  Apps,
  Home,

  // 🔸 Categoría: Aplicación
  DocumentScanner,
  GridView,
  ContactPhone,

  // 🔸 Categoría: Ventas
  ShoppingCart,
  LocalOffer,
  LocalAtm,
  CurrencyExchange,
  MonetizationOn,
  ShoppingBag,
  WorkspacePremium,

  // 🔸 Logistica
  Warehouse,
  BackupTable,

  // 🔸 Sistemas
  SettingsSuggest,
  DataObject,

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
