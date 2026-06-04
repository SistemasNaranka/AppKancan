import ContabilidadIcon from "@mui/icons-material/AccountBalance";
import RRHHIcon from "@mui/icons-material/People";
import LogisticaIcon from "@mui/icons-material/LocalShipping";
import DisenoIcon from "@mui/icons-material/DesignServices";
import SistemasIcon from "@mui/icons-material/Computer";
import MercadeoIcon from "@mui/icons-material/Campaign";

export const AREAS_PREDEFINIDAS = [
  "Contabilidad",
  "Recursos Humanos",
  "Logística",
  "Diseño",
  "Sistemas",
  "Mercadeo",
];

export const ICONOS_AREA: Record<string, React.ElementType> = {
  "Contabilidad": ContabilidadIcon,
  "Recursos Humanos": RRHHIcon,
  "Logística": LogisticaIcon,
  "Diseño": DisenoIcon,
  "Sistemas": SistemasIcon,
  "Mercadeo": MercadeoIcon,
};

export function getProjectTypeLabel(tipo: string | undefined): string {
  if (!tipo) return "No especificado";

  const tipoLower = tipo.toLowerCase();

  const mapeo: Record<string, string> = {
    "proyecto_nuevo": "Proyecto Nuevo",
    "proyectonuevo": "Proyecto Nuevo",
    "actualizacion": "Actualización",
    "actualizacion_de_sistema": "Actualización de Sistema",
    "nuevo_proyecto": "Proyecto Nuevo",
  };

  if (mapeo[tipoLower]) {
    return mapeo[tipoLower];
  }

  return tipoLower
    .replace(/_/g, " ")
    .split(" ")
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(" ");
}