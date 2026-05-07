import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

const STORAGE_KEY = "home_tutorial_seen_v1";

const steps: Step[] = [
  {
    target: ".tutorial-saludo",
    title: "¡Bienvenido a tu Home!",
    content:
      "Este es tu panel principal. Aquí verás tu información personal, aplicaciones asignadas y accesos rápidos a herramientas externas.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tutorial-reloj",
    title: "Fecha y hora",
    content:
      "Aquí puedes ver la hora y la fecha actual actualizadas en tiempo real.",
    placement: "bottom",
  },
  {
    target: ".tutorial-conexion",
    title: "Estado de conexión",
    content:
      "Indica la calidad de tu conexión a internet. Pasa el cursor sobre el ícono para ver el detalle de latencia y estado.",
    placement: "bottom",
  },
  {
    target: ".tutorial-mis-apps",
    title: "Mis Aplicaciones",
    content:
      "Estas son las aplicaciones asignadas a tu área. Haz clic en cualquiera para ingresar a ella.",
    placement: "bottom",
  },
  {
    target: ".tutorial-apps-externas",
    title: "Aplicaciones Externas",
    content:
      "Accesos directos a Gmail, Drive y Sheets. Se abren en una nueva pestaña del navegador.",
    placement: "left",
  },
];

interface HomeTutorialProps {
  ready?: boolean;
}

function HomeTutorial({ ready = true }: HomeTutorialProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;
    const t = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(t);
  }, [ready]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    const finished: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finished.includes(status)) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
      disableScrollParentFix
      scrollToFirstStep
      callback={handleCallback}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        skip: "Omitir",
      }}
      styles={{
        options: {
          primaryColor: "#004680",
          zIndex: 10000,
          arrowColor: "#ffffff",
          backgroundColor: "#ffffff",
          textColor: "#1a1a1a",
          overlayColor: "rgba(0, 0, 0, 0.55)",
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipTitle: {
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#1a1a1a",
        },
        tooltipContent: {
          fontSize: "0.95rem",
          color: "#444",
          padding: "8px 0",
        },
        buttonNext: {
          backgroundColor: "#004680",
          borderRadius: 8,
          fontWeight: 600,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#004680",
          fontWeight: 600,
          marginRight: 8,
        },
        buttonSkip: {
          color: "#888",
          fontWeight: 500,
        },
      }}
    />
  );
}

export default HomeTutorial;
