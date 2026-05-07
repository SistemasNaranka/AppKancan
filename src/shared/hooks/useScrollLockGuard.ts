import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Safety net global agresivo contra "scroll bloqueado / barra desaparecida".
 *
 * Vigila body Y main (este app tiene scroll en <main>, no en body).
 *
 * Capas:
 *  1. MutationObserver sobre body y main → reacciona a cualquier cambio inline.
 *  2. Resize listener (zoom out emite resize).
 *  3. Polling cada 1s como red de seguridad (por si Mutation no captura algo).
 *  4. Logging visible en consola cuando detecta el bug.
 *  5. Override forzado: si tras 3 ciclos seguidos el lock persiste con overlay
 *     "vivo" sospechoso, fuerza limpieza (probable overlay zombie de Joyride
 *     o Backdrop pegado).
 *
 * Activar logging detallado: localStorage.setItem("scrollGuardDebug", "1").
 */
export function useScrollLockGuard() {
  const location = useLocation();

  useEffect(() => {
    // Logging SIEMPRE activo mientras debuggeamos. Quitar cuando se resuelva.
    const log = (...args: unknown[]) => {
      console.warn("[ScrollGuard]", ...args);
    };

    log("✅ Hook montado en ruta", location.pathname, "| timestamp:", new Date().toLocaleTimeString());

    // Solo overlays que LEGÍTIMAMENTE justifican body.overflow=hidden.
    // EXCLUSIONES IMPORTANTES:
    //  - .MuiDrawer-docked: sidebar lateral permanente del Layout, no es overlay
    //  - .MuiPopover-root / .MuiPopper-root: dropdowns y tooltips, no bloquean scroll
    //  - .MuiPaper-root: hijo de Dialog, ya cubierto por .MuiDialog-root
    const OVERLAY_SELECTORS = [
      // Modales reales (excluye drawer docked).
      '.MuiModal-root:not(.MuiDrawer-docked):not([aria-hidden="true"])',
      ".MuiDialog-root",
      // Solo drawers en modo modal/temporary (no docked/persistent).
      '.MuiDrawer-modal:not([aria-hidden="true"])',
      // Roles ARIA genéricos.
      '[role="dialog"]:not([aria-hidden="true"])',
      '[role="alertdialog"]',
      // React Joyride V2.
      ".react-joyride__overlay",
      ".react-joyride__spotlight",
      '[data-test-id="joyride-overlay"]',
    ].join(",");

    let scheduled = 0;
    let pollTimer = 0;
    let stuckCount = 0; // ciclos consecutivos con lock + overlay vivo

    const findLockSources = () => {
      const body = document.body;
      const main = document.querySelector("main") as HTMLElement | null;
      const sources: string[] = [];

      // Inline styles
      if (body.style.overflow === "hidden") sources.push("body.style.overflow=hidden");
      if (body.style.paddingRight) sources.push(`body.style.paddingRight=${body.style.paddingRight}`);
      if (main) {
        // Detectar TANTO 'hidden' como 'initial' (este último viene de
        // react-joyride V2 que pone parent.style.overflow='initial' en el
        // scroll parent del target y nunca lo restaura — bug conocido).
        if (main.style.overflow === "hidden" || main.style.overflow === "initial") {
          sources.push(`main.style.overflow=${main.style.overflow}`);
        }
        if (main.style.overflowY === "hidden" || main.style.overflowY === "initial") {
          sources.push(`main.style.overflowY=${main.style.overflowY}`);
        }
      }

      // Computed styles (catches CSS rules, not just inline)
      const bodyComputed = getComputedStyle(body);
      if (bodyComputed.overflow === "hidden") sources.push("body[computed].overflow=hidden");
      if (bodyComputed.overflowY === "hidden") sources.push("body[computed].overflowY=hidden");
      if (main) {
        const mainComputed = getComputedStyle(main);
        if (mainComputed.overflowY === "hidden") sources.push("main[computed].overflowY=hidden");
      }

      return sources;
    };

    // Snapshot completo de scroll containers cuando el user lo solicite.
    // Para invocar manualmente: en consola escribe `window.__scrollGuardSnapshot()`
    (window as any).__scrollGuardSnapshot = () => {
      const body = document.body;
      const html = document.documentElement;
      const main = document.querySelector("main") as HTMLElement | null;

      const summary: any[] = [];

      const inspect = (el: HTMLElement, label: string) => {
        const cs = getComputedStyle(el);
        summary.push({
          label,
          tag: el.tagName.toLowerCase(),
          inlineOverflow: el.style.overflow || "(none)",
          inlineOverflowY: el.style.overflowY || "(none)",
          computedOverflow: cs.overflow,
          computedOverflowY: cs.overflowY,
          height: cs.height,
          minHeight: cs.minHeight,
          maxHeight: cs.maxHeight,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollable: el.scrollHeight > el.clientHeight,
          paddingRight: el.style.paddingRight || cs.paddingRight,
        });
      };

      inspect(html, "<html>");
      inspect(body, "<body>");
      if (main) inspect(main, "<main>");

      // Recorrer todos los descendientes con overflow auto/scroll/hidden
      document.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const cs = getComputedStyle(el);
        if (
          (cs.overflowY === "auto" || cs.overflowY === "scroll" || cs.overflowY === "hidden") &&
          el !== body &&
          el !== html &&
          el !== main &&
          el.scrollHeight > 0
        ) {
          // Solo elementos significativos (con contenido real)
          if (el.clientHeight > 100) {
            inspect(el, `descendant: ${el.tagName.toLowerCase()}.${(typeof el.className === "string" ? el.className : "").split(" ").slice(0, 2).join(".")}`);
          }
        }
      });

      console.table(summary);
      return summary;
    };

    const liveOverlays = (): Element[] => {
      try {
        return Array.from(document.querySelectorAll(OVERLAY_SELECTORS));
      } catch {
        return [];
      }
    };

    const restore = (force = false) => {
      const body = document.body;
      const main = document.querySelector("main") as HTMLElement | null;

      log("RESTORE", { force, sources: findLockSources() });

      if (body.style.overflow === "hidden") body.style.overflow = "";
      if (body.style.paddingRight) body.style.paddingRight = "";
      if (main) {
        // Limpia tanto 'hidden' como 'initial' (Joyride V2 deja 'initial').
        if (main.style.overflow === "hidden" || main.style.overflow === "initial") {
          main.style.overflow = "";
        }
        if (main.style.overflowY === "hidden" || main.style.overflowY === "initial") {
          main.style.overflowY = "";
        }
      }

      // Backdrops huérfanos.
      document.querySelectorAll<HTMLElement>(".MuiBackdrop-root").forEach((el) => {
        const parent = el.closest(
          ".MuiModal-root, .MuiDialog-root, .MuiDrawer-root, .MuiPopover-root",
        );
        if (!parent) {
          log("Removing orphan MUI Backdrop", el);
          el.remove();
        }
      });
      // Joyride overlay huérfano.
      document.querySelectorAll<HTMLElement>(".react-joyride__overlay").forEach((el) => {
        const hasSpotlight = document.querySelector(".react-joyride__spotlight");
        if (!hasSpotlight || force) {
          log("Removing orphan Joyride overlay", el);
          el.remove();
        }
      });

      stuckCount = 0;
    };

    const checkAndFix = () => {
      const sources = findLockSources();
      if (sources.length === 0) {
        stuckCount = 0;
        return;
      }

      const overlays = liveOverlays();
      // Detalle plano de cada overlay para identificar qué los está poniendo.
      const overlayDetails = overlays.map((el, i) => {
        const cls = el.className && typeof el.className === "string" ? el.className : "";
        const role = el.getAttribute("role") || "";
        const ariaHidden = el.getAttribute("aria-hidden") || "";
        return `${i}: <${el.tagName.toLowerCase()}> class="${cls.slice(0, 80)}" role="${role}" aria-hidden="${ariaHidden}"`;
      });
      log(
        "🚨 LOCK detected",
        "\n  sources:", sources.join(" | "),
        "\n  overlays count:", overlays.length,
        "\n  stuckCount:", stuckCount,
        "\n  overlay details:\n   ", overlayDetails.join("\n    "),
      );

      if (overlays.length === 0) {
        // No hay overlay legítimo → limpiar.
        restore(false);
        return;
      }

      // Hay overlay vivo. Espera unos ciclos antes de forzar.
      stuckCount += 1;
      if (stuckCount >= 3) {
        log("⚡ FORCE restore — lock persists with stale overlays", overlays);
        restore(true);
      }
    };

    const scheduleCheck = (delay = 150) => {
      window.clearTimeout(scheduled);
      scheduled = window.setTimeout(checkAndFix, delay);
    };

    // 1. MutationObserver sobre body + main.
    const targets: Element[] = [document.body];
    const main = document.querySelector("main");
    if (main) targets.push(main);

    const observer = new MutationObserver(() => scheduleCheck(150));
    targets.forEach((t) =>
      observer.observe(t, { attributes: true, attributeFilter: ["style"] }),
    );

    // 2. Resize.
    const onResize = () => scheduleCheck(200);
    window.addEventListener("resize", onResize, { passive: true });

    // 3. Polling 1s.
    pollTimer = window.setInterval(checkAndFix, 1000);

    // 4. Check inicial.
    scheduleCheck(300);

    return () => {
      log("🧹 Hook desmontado en ruta", location.pathname);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(scheduled);
      window.clearInterval(pollTimer);
    };
  }, [location.pathname]);
}
