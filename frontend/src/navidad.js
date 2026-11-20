// 🎄 Temporada navideña: se activa sola del 15 de noviembre al 7 de enero.
// Para forzarla: FORZAR = true (siempre) o false (nunca). null = según la fecha.
const FORZAR = null;

export function esNavidad(fecha = new Date()) {
  if (FORZAR !== null) return FORZAR;
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  return (m === 11 && d >= 15) || m === 12 || (m === 1 && d <= 7);
}

export const NAVIDAD = esNavidad();
