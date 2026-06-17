import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Fade,
} from "@mui/material";
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import WatchLater from '@mui/icons-material/WatchLater';
import DesktopWindows from '@mui/icons-material/DesktopWindows';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Cancel from '@mui/icons-material/Cancel';

import directus from "@/services/directus/directus";
import { getGoodsReceiptById } from "../services/api";

const MAX_WAIT_TIME_SECONDS = 120; // 2 minutos

interface CausacionProgressModalProps {
  open: boolean;
  goodsReceiptId: number | null;
  goodsReceiptNumber: string | null;
  onSuccess: () => void;
  onFailure: (message: string) => void;
  onClose: () => void;
}

type ModalState = "checking" | "waiting" | "success" | "failure";

export function CausacionProgressModal({
  open,
  goodsReceiptId,
  goodsReceiptNumber,
  onSuccess,
  onFailure,
  onClose,
}: CausacionProgressModalProps) {
  const [modalState, setModalState] = useState<ModalState>("checking");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>("en_proceso");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectCount, setRedirectCount] = useState(3);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Guardar los callbacks en una referencia para evitar reiniciar el useEffect de monitoreo
  const callbacksRef = useRef({ onSuccess, onFailure, onClose });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onFailure, onClose };
  }, [onSuccess, onFailure, onClose]);

  // Formatear el tiempo transcurrido
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!open || !goodsReceiptId) {
      // Resetear estados al cerrar o no tener ID
      setModalState("checking");
      setElapsedTime(0);
      setCurrentStatus("en_proceso");
      setErrorMessage(null);
      setRedirectCount(3);
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }

    let active = true;
    let stopSubscription: (() => void) | null = null;

    // Timer de 1 segundo para el tiempo transcurrido
    setElapsedTime(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        if (prev >= MAX_WAIT_TIME_SECONDS - 1) {
          clearInterval(elapsedTimerRef.current!);
          if (active) {
            handleProcessFailure(
              "Tiempo de espera agotado (2 minutos sin respuesta del sistema Ultra local)."
            );
          }
          return MAX_WAIT_TIME_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);

    const handleProcessSuccess = () => {
      if (!active) return;
      setModalState("success");
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

      // Iniciar conteo regresivo de 3 segundos para el redireccionamiento automático
      setRedirectCount(3);
      redirectTimerRef.current = setInterval(() => {
        setRedirectCount((prev) => {
          if (prev <= 1) {
            clearInterval(redirectTimerRef.current!);
            setTimeout(() => {
              callbacksRef.current.onSuccess();
              callbacksRef.current.onClose();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleProcessFailure = (msg: string) => {
      if (!active) return;
      setModalState("failure");
      setErrorMessage(msg);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      setTimeout(() => {
        callbacksRef.current.onFailure(msg);
      }, 0);
    };

    const startMonitoring = async () => {
      // 1. Verificación inicial de estado mediante REST
      try {
        const currentReceipt = await getGoodsReceiptById(goodsReceiptId);
        if (active && currentReceipt) {
          if (currentReceipt.status) {
            setCurrentStatus(currentReceipt.status);
          }
          const initialStatus = String(currentReceipt.status || "").trim().toLowerCase();
          if (
            initialStatus === "causado" ||
            initialStatus === "causada" ||
            initialStatus.includes("causad")
          ) {
            handleProcessSuccess();
            return;
          } else if (initialStatus === "pendiente") {
            handleProcessFailure(
              "El proceso local de causación finalizó con estado 'pendiente' (fallido)."
            );
            return;
          }
        }
      } catch (err) {
        console.error("Error al obtener estado inicial por REST:", err);
      }

      if (!active) return;
      setModalState("waiting");

      // 2. Suscripción en tiempo real vía WebSockets
      try {
        try {
          await directus.connect();
        } catch (e: any) {
          if (!e?.message?.includes('state is "open"') && !e?.message?.includes('state is "connecting"')) {
            throw e;
          }
        }

        const { subscription, unsubscribe } = await directus.subscribe("acc_goods_receipts", {
          event: "update",
          query: {
            fields: ["id", "document_number", "status"],
            filter: {
              id: { _eq: goodsReceiptId },
            },
          },
        });

        stopSubscription = unsubscribe;

        for await (const message of subscription) {
          if (!active) break;
          if (message.event === "update") {
            const data = message.data;
            const items = Array.isArray(data) ? data : [data];
            const match = items.find((x) => x && String(x.id) === String(goodsReceiptId));
            if (match) {
              if (match.status) {
                setCurrentStatus(match.status);
              }
              const matchStatus = String(match.status || "").trim().toLowerCase();
              if (
                matchStatus === "causado" ||
                matchStatus === "causada" ||
                matchStatus.includes("causad")
              ) {
                handleProcessSuccess();
                break;
              } else if (matchStatus === "pendiente") {
                handleProcessFailure(
                  "El proceso de causación local de Ultra finalizó con error o fue cancelado."
                );
                break;
              }
            }
          }
        }
      } catch (wsErr) {
        console.error("Error al iniciar suscripción de WebSockets:", wsErr);
        // Si falla el WebSocket, seguimos con el timer de 2 minutos que hará fallback
      }
    };

    startMonitoring();

    return () => {
      active = false;
      if (stopSubscription) {
        try {
          // unsubscribe de Directus retorna una Promesa (o void según los typings).
          // Para evitar el error de TypeScript "An expression of type 'void' cannot be tested for truthiness",
          // casteamos el resultado a 'any' antes de verificar si tiene un método '.catch'.
          const result = stopSubscription() as any;
          if (result && typeof result.catch === "function") {
            result.catch((err: any) => {
              console.warn("WebSocket unsubscribe promise rejected safely:", err);
            });
          }
        } catch (err) {
          console.warn("WebSocket unsubscribe failed synchronously:", err);
        }
      }
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [open, goodsReceiptId]);

  // Manejar click en continuar de forma manual durante el éxito
  const handleManualSuccessContinue = () => {
    if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    setTimeout(() => {
      callbacksRef.current.onSuccess();
      callbacksRef.current.onClose();
    }, 0);
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
        },
      }}
      // Evitar que el usuario cierre el modal dando click afuera o con Escape
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose();
        }
      }}
    >
      <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, px: 2 }}>
        {/* === PANTALLAS DE ESTADO === */}

        {(modalState === "checking" || modalState === "waiting") && (
          <Fade in timeout={400}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
              {/* Contenedor del Spinner Animado */}
              <Box sx={{ position: "relative", display: "inline-flex", mb: 3 }}>
                <CircularProgress
                  size={80}
                  thickness={4}
                  sx={{
                    color: "#0284c7",
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DesktopWindows sx={{ fontSize: 32, color: "#004680", opacity: 0.8 }} />
                </Box>
              </Box>

              <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a", mb: 1 }}>
                Ejecutando en Ultra
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 1, lineHeight: 1.6 }}>
                Se inició la causación de la entrada <strong>#{goodsReceiptNumber}</strong>. Por favor, mantén abierto el programa Ultra en tu pantalla para completar la transacción.
              </Typography>

              {/* Box de tiempo transcurrido */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <WatchLater sx={{ fontSize: 18, color: "#64748b" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#475569" }}>
                    Tiempo transcurrido: {formatTime(elapsedTime)} / 2:00
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ color: "#475569", fontWeight: 500, backgroundColor: "#f8fafc", px: 1.5, py: 0.5, borderRadius: 1, border: "1px dashed #cbd5e1" }}>
                  Estado detectado: <strong>{currentStatus}</strong>
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        {modalState === "success" && (
          <Fade in timeout={400}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#ecfdf5",
                  border: "2px solid #34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                  mb: 2.5,
                  boxShadow: "0 8px 20px rgba(16, 185, 129, 0.15)",
                }}
              >
                <CheckCircleOutline sx={{ fontSize: 48 }} />
              </Box>

              <Typography variant="h6" fontWeight={700} sx={{ color: "#065f46", mb: 1 }}>
                ¡Causación Exitosa!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 1, lineHeight: 1.6 }}>
                La factura correspondiente a la entrada <strong>#{goodsReceiptNumber}</strong> se causó correctamente en Ultra y se guardó en la base de datos.
              </Typography>

              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                Redireccionando a la vista de escaneo en {redirectCount} segundos...
              </Typography>
            </Box>
          </Fade>
        )}

        {modalState === "failure" && (
          <Fade in timeout={400}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#fff1f2",
                  border: "2px solid #fda4af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f43f5e",
                  mb: 2.5,
                  boxShadow: "0 8px 20px rgba(244, 63, 94, 0.15)",
                }}
              >
                <ErrorOutline sx={{ fontSize: 48 }} />
              </Box>

              <Typography variant="h6" fontWeight={700} sx={{ color: "#9f1239", mb: 1 }}>
                Error en la causación
              </Typography>
              <Typography variant="body2" sx={{ color: "#475569", mb: 3, px: 1, lineHeight: 1.6 }}>
                {errorMessage || "Ocurrió un error inesperado al procesar la causación local en Ultra."}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ backgroundColor: "#f8fafc", p: 1.5, borderRadius: 2, borderLeft: "4px solid #cbd5e1", width: "100%", textAlign: "left", fontSize: "0.85rem" }}>
                💡 Puedes revisar que Ultra esté ejecutándose correctamente y presionar <strong>Cerrar e Intentar de Nuevo</strong> para habilitar el botón de causar nuevamente.
              </Typography>
            </Box>
          </Fade>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: "center" }}>
        {modalState === "success" && (
          <Button
            variant="contained"
            onClick={handleManualSuccessContinue}
            startIcon={<PlayArrow />}
            sx={{
              backgroundColor: "#10b981",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2.5,
              px: 4,
              py: 1,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#059669",
                boxShadow: "none",
              },
            }}
          >
            Aceptar y Continuar
          </Button>
        )}

        {modalState === "failure" && (
          <Button
            variant="contained"
            onClick={onClose}
            startIcon={<Cancel />}
            sx={{
              backgroundColor: "#f43f5e",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2.5,
              px: 3,
              py: 1,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#e11d48",
                boxShadow: "none",
              },
            }}
          >
            Cerrar e Intentar de Nuevo
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
