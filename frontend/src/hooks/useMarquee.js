import { useEffect, useRef } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";

// Marquesina movida por JS (requestAnimationFrame) en vez de @keyframes CSS:
// Safari iOS a veces deja congeladas las animaciones CSS en pistas muy anchas.
// La pista debe tener dos mitades idénticas; recorre una mitad cada `durationSec`.
//
// Zoom con los dedos (iPhone): el navegador vuelve a pintar las capas de GPU a la
// resolución del zoom. Una pista de miles de px con will-change, animada en cada
// frame, se vuelve enorme y iOS mata la pestaña ("No se puede abrir esta página").
// Por eso mientras la página está ampliada se pausa y se quita la capa propia.
export default function useMarquee(durationSec = 40) {
  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const offset = useRef(0);
  const paused = useRef(false);
  const zoomed = useRef(false);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const check = () => {
      const isZoomed = vv.scale > 1.01;
      if (isZoomed === zoomed.current) return;
      zoomed.current = isZoomed;
      const el = trackRef.current;
      if (el) el.style.willChange = isZoomed ? "auto" : "transform";
    };
    check();
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  useAnimationFrame((_, delta) => {
    const el = trackRef.current;
    if (!el || paused.current || zoomed.current) return;
    const half = el.scrollWidth / 2;
    if (!half) return;
    const dt = Math.min(delta, 100); // evita saltos al volver de otra pestaña
    offset.current = (offset.current + (half / (durationSec * 1000)) * dt) % half;
    x.set(-offset.current);
  });

  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };

  // Pausa con el mouse encima (solo desktop) o mientras se mantiene presionado
  const handlers = {
    onPointerEnter: (e) => { if (e.pointerType === "mouse") pause(); },
    onPointerLeave: resume,
    onPointerDown: pause,
    onPointerUp: (e) => { if (e.pointerType !== "mouse") resume(); },
    onPointerCancel: resume,
  };

  return { trackRef, x, handlers };
}
