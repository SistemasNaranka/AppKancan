
import { resolveNetworkUrl } from "@/shared/utils/network";
import { FacturaValida } from "../page/RuletaHome";

const WEBHOOK_URL_RULETA = resolveNetworkUrl(import.meta.env.VITE_WEBHOOK_URL_PREMIO_RULETA);

export async function comprobarFactura(prefijo: string, numero: string) : Promise<FacturaValida> {
  const url = WEBHOOK_URL_RULETA;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({empresa:  "Naranka", prefijo: prefijo, numero: numero }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo validar la factura');
  }
  const data = await res.json(); 
  const facturaData: FacturaValida = {
      cliente: data.cliente || 'Cliente no identificado',
      puedeGirar: data.puedeGirar && data.puedeGirar !== 0 ? true : false,
      estadoStock: data.estadoStock ?? 'OK',
      mensajeStock: data.message ?? '',
      prize: data.prize ?? '',
      bodega: data.bodega?? 0,
      tier:  data.tier ??"",
      probabilidad: data.probabilidad,
      documentos: prefijo + numero
  };
  return facturaData;
}



