// src/components/LoadingOverlay.jsx
import logo from "../assets/logo.png";

export default function LoadingOverlay({ message = "Cargando catálogo..." }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 text-white backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-black/70 px-10 py-8 shadow-2xl">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-white" />
          <img src={logo} alt="" className="absolute inset-2 h-12 w-12 rounded-full" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">{message}</p>
      </div>
    </div>
  );
}
