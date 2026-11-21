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

  // Arrastre con el dedo / mouse (iPhone y Android): mueve el riel a mano y al
  // soltar sigue con un poco de inercia antes de retomar el auto-scroll.
  const drag = useRef({ active: false, moved: false, id: null, startX: 0, startOffset: 0, lastX: 0, lastT: 0 });
  const velocity = useRef(0); // px/ms; positivo = hacia la izquierda (igual que el auto-scroll)
  const suppressClick = useRef(false);

  const wrap = (v, half) => ((v % half) + half) % half;

  useAnimationFrame((_, delta) => {
    const el = trackRef.current;
    if (!el || zoomed.current || drag.current.active) return;
    const half = el.scrollWidth / 2;
    if (!half) return;
    const dt = Math.min(delta, 100); // evita saltos al volver de otra pestaña
    // Inercia tras soltar
    if (Math.abs(velocity.current) > 0.02) {
      offset.current = wrap(offset.current + velocity.current * dt, half);
      velocity.current *= Math.pow(0.95, dt / 16);
      x.set(-offset.current);
      return;
    }
    velocity.current = 0;
    if (paused.current) return;
    offset.current = (offset.current + (half / (durationSec * 1000)) * dt) % half;
    x.set(-offset.current);
  });

  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d.active || (e && e.pointerId !== d.id)) return false;
    d.active = false;
    if (d.moved) {
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
    } else {
      velocity.current = 0;
    }
    return true;
  };

  // Pausa con el mouse encima (solo desktop); con el dedo se arrastra
  const handlers = {
    onPointerEnter: (e) => { if (e.pointerType === "mouse") pause(); },
    onPointerLeave: (e) => { if (e.pointerType === "mouse") resume(); },
    onPointerDown: (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const d = drag.current;
      d.active = true;
      d.moved = false;
      d.id = e.pointerId;
      d.startX = d.lastX = e.clientX;
      d.lastT = e.timeStamp;
      d.startOffset = offset.current;
      velocity.current = 0;
    },
    onPointerMove: (e) => {
      const d = drag.current;
      const el = trackRef.current;
      if (!d.active || e.pointerId !== d.id || !el) return;
      const dx = e.clientX - d.startX;
      if (!d.moved) {
        if (Math.abs(dx) < 6) return;
        d.moved = true;
        try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
      }
      const half = el.scrollWidth / 2;
      if (!half) return;
      const dt = Math.max(e.timeStamp - d.lastT, 1);
      velocity.current = -(e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
      offset.current = wrap(d.startOffset - dx, half);
      x.set(-offset.current);
    },
    onPointerUp: (e) => {
      // Si el dedo se quedó quieto antes de soltar, no hay inercia
      if (e.timeStamp - drag.current.lastT > 80) velocity.current = 0;
      velocity.current = Math.max(-3, Math.min(3, velocity.current));
      endDrag(e);
    },
    onPointerCancel: (e) => { velocity.current = 0; endDrag(e); },
    // Evita que soltar tras arrastrar dispare el click de una tarjeta
    onClickCapture: (e) => {
      if (suppressClick.current || drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }
    },
    onDragStart: (e) => e.preventDefault(),
  };

  return { trackRef, x, handlers };
}
