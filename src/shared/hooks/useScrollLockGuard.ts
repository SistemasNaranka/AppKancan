import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollLockGuard() {
  const location = useLocation();

  useEffect(() => {
    const log = (..._args: unknown[]) => { /* logging disabled */ };
    const OVERLAY_SELECTORS = [
      '.MuiModal-root:not(.MuiDrawer-docked):not([aria-hidden="true"])',
      ".MuiDialog-root",
      '.MuiDrawer-modal:not([aria-hidden="true"])',
      '[role="dialog"]:not([aria-hidden="true"])',
      '[role="alertdialog"]',
      ".react-joyride__overlay",
      ".react-joyride__spotlight",
      '[data-test-id="joyride-overlay"]',
    ].join(",");

    let scheduled = 0;
    let pollTimer = 0;
    let stuckCount = 0;

    const findLockSources = () => {
      const body = document.body;
      const main = document.querySelector("main") as HTMLElement | null;
      const sources: string[] = [];

      if (body.style.overflow === "hidden") sources.push("body.style.overflow=hidden");
      if (body.style.paddingRight) sources.push(`body.style.paddingRight=${body.style.paddingRight}`);
      if (main) {

        if (main.style.overflow === "hidden" || main.style.overflow === "initial") {
          sources.push(`main.style.overflow=${main.style.overflow}`);
        }
        if (main.style.overflowY === "hidden" || main.style.overflowY === "initial") {
          sources.push(`main.style.overflowY=${main.style.overflowY}`);
        }
      }

      const bodyComputed = getComputedStyle(body);
      if (bodyComputed.overflow === "hidden") sources.push("body[computed].overflow=hidden");
      if (bodyComputed.overflowY === "hidden") sources.push("body[computed].overflowY=hidden");
      if (main) {
        const mainComputed = getComputedStyle(main);
        if (mainComputed.overflowY === "hidden") sources.push("main[computed].overflowY=hidden");
      }

      return sources;
    };


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

      document.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const cs = getComputedStyle(el);
        if (
          (cs.overflowY === "auto" || cs.overflowY === "scroll" || cs.overflowY === "hidden") &&
          el !== body &&
          el !== html &&
          el !== main &&
          el.scrollHeight > 0
        ) {
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
        if (main.style.overflow === "hidden" || main.style.overflow === "initial") {
          main.style.overflow = "";
        }
        if (main.style.overflowY === "hidden" || main.style.overflowY === "initial") {
          main.style.overflowY = "";
        }
      }

      document.querySelectorAll<HTMLElement>(".MuiBackdrop-root").forEach((el) => {
        const parent = el.closest(
          ".MuiModal-root, .MuiDialog-root, .MuiDrawer-root, .MuiPopover-root",
        );
        if (!parent) {
          log("Removing orphan MUI Backdrop", el);
          el.remove();
        }
      });
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
        restore(false);
        return;
      }

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

    const targets: Element[] = [document.body];
    const main = document.querySelector("main");
    if (main) targets.push(main);

    const observer = new MutationObserver(() => scheduleCheck(150));
    targets.forEach((t) =>
      observer.observe(t, { attributes: true, attributeFilter: ["style"] }),
    );

    const onResize = () => scheduleCheck(200);
    window.addEventListener("resize", onResize, { passive: true });

    pollTimer = window.setInterval(checkAndFix, 1000);

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
