import { useRef } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";

// Marquesina movida por JS (requestAnimationFrame) en vez de @keyframes CSS:
// Safari iOS a veces deja congeladas las animaciones CSS en pistas muy anchas.
// La pista debe tener dos mitades idénticas; recorre una mitad cada `durationSec`.
export default function useMarquee(durationSec = 40) {
  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const offset = useRef(0);
  const paused = useRef(false);

  useAnimationFrame((_, delta) => {
    const el = trackRef.current;
    if (!el || paused.current) return;
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
