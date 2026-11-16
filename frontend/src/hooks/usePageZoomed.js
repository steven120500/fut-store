import { useEffect, useState } from "react";

// true mientras el usuario tiene la página ampliada con los dedos (pinch-zoom).
// iOS vuelve a pintar las capas de GPU a la resolución del zoom; los efectos grandes
// (3D, filtros, animaciones que repintan) pueden agotar la memoria y matar la pestaña.
export default function usePageZoomed() {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const check = () => setZoomed(vv.scale > 1.01);
    check();
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  return zoomed;
}
