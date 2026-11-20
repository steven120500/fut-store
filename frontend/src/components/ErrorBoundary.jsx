import React from "react";

// 🛟 Red de seguridad: si un componente falla al dibujarse, en vez de dejar TODA la página
// en blanco se muestra `fallback` (o una pantalla para recargar). Úsalo:
//   - Alrededor de la app/rutas → pantalla "Algo salió mal · Recargar".
//   - Alrededor de piezas sueltas (ej. una tarjeta) con fallback={null} → solo esa pieza desaparece.
// `resetKey`: si cambia (ej. la ruta), se vuelve a intentar dibujar.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.name ? ` · ${this.props.name}` : ""}]`, error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black px-6 text-center text-white">
        <div className="max-w-sm">
          <img src="/logo.png" alt="FutStore" className="mx-auto mb-6 h-16 w-16 rounded-full ring-1 ring-white/20" />
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300">Ups</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight">Algo salió mal</h1>
          <p className="mt-3 text-sm text-white/60">
            Tuvimos un problema mostrando esta página. Recarga para intentarlo de nuevo; tu carrito sigue guardado.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition hover:bg-cyan-300"
            >
              Recargar
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="rounded-full border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-white/80 transition hover:border-white hover:text-white"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}
