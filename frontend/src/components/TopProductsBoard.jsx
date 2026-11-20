import { cld } from "../utils/cloudinary";
import React, { useState, useEffect, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaMedal, FaTshirt, FaImage, FaCrown, FaMoneyBillWave, FaLayerGroup, FaRedo } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_BASE || "https://fut-store.onrender.com";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const FILTROS = [
  { id: 'todo', label: 'Todo' },
  { id: 'chemas', label: 'Chemas' },
  { id: 'tacos', label: 'Tacos' },
];
const POR_PAGINA = 12;

const colones = (n) => `₡${Math.round(Number(n) || 0).toLocaleString('es-CR')}`;
const colonesCorto = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `₡${(v / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (v >= 1_000) return `₡${Math.round(v / 1_000)}K`;
  return `₡${v}`;
};
// Compatibilidad: la API antes devolvía solo el arreglo
const esTacoLocal = (p) => /taco/i.test(`${p.tipo || ''} ${p.nombre || ''}`);

const MEDALLAS = [
  { color: '#22D3EE', texto: '#000', glow: '0 12px 40px rgba(34,211,238,0.22)' },
  { color: '#CBD5E1', texto: '#000', glow: '0 8px 24px rgba(203,213,225,0.10)' },
  { color: '#0E7490', texto: '#fff', glow: '0 8px 24px rgba(14,116,144,0.15)' },
];

function Miniatura({ src, alt, className = '', preset = 'thumb' }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <div className={`flex items-center justify-center bg-gray-900 ${className}`}><FaImage className="text-gray-700" /></div>;
  }
  return <img src={cld(src, preset)} alt={alt} loading="lazy" decoding="async" onError={() => setError(true)} className={`object-cover object-top bg-gray-900 ${className}`} />;
}

function Tallas({ tallas, compacto = false }) {
  if (!tallas?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${compacto ? '' : 'justify-center'}`}>
      {tallas.map(t => (
        <span key={t.talla} className="text-[9px] font-black uppercase bg-gray-800/80 text-gray-300 px-1.5 py-0.5 rounded">
          {t.talla} <span className="text-cyan-400">×{t.cantidad}</span>
        </span>
      ))}
    </div>
  );
}

function Stat({ icon, label, valor, sub }) {
  return (
    <div className="bg-black/60 border border-gray-800 rounded-xl p-3 sm:p-4 min-w-0">
      <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1.5">{icon} {label}</span>
      <span className="block text-lg sm:text-2xl font-black text-white mt-1 truncate">{valor}</span>
      {sub && <span className="block text-[10px] text-gray-500 font-bold truncate">{sub}</span>}
    </div>
  );
}

export default function TopProductsBoard() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [datos, setDatos] = useState({ productos: [], resumen: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [filtro, setFiltro] = useState('todo');
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [recarga, setRecarga] = useState(0);

  const esMesActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    setVisibles(POR_PAGINA);
    fetch(`${API_BASE}/api/sales/top-products?year=${anio}&month=${mes}&formato=2`, { signal: ctrl.signal })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
      .then(data => {
        if (Array.isArray(data)) {
          setDatos({ productos: data.map(p => ({ ...p, categoria: esTacoLocal(p) ? 'tacos' : 'chemas' })), resumen: null });
        } else {
          setDatos({ productos: data.productos || [], resumen: data.resumen || null });
        }
      })
      .catch(err => { if (err.name !== 'AbortError') { console.error("Error al cargar top productos:", err); setError(true); } })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [mes, anio, recarga]);

  const cambiarMes = (delta) => {
    let m = mes + delta, a = anio;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    if (a > hoy.getFullYear() || (a === hoy.getFullYear() && m > hoy.getMonth() + 1)) return;
    setMes(m); setAnio(a);
  };

  const productos = useMemo(
    () => (filtro === 'todo' ? datos.productos : datos.productos.filter(p => p.categoria === filtro)),
    [datos.productos, filtro]
  );

  const resumen = useMemo(() => {
    if (filtro === 'todo' && datos.resumen) return datos.resumen;
    return {
      unidades: productos.reduce((a, p) => a + (p.totalUnidadesVendidas || 0), 0),
      dinero: productos.reduce((a, p) => a + (p.totalDineroGenerado || 0), 0),
      modelos: productos.length,
    };
  }, [datos.resumen, productos, filtro]);

  const top3 = productos.slice(0, 3);
  const resto = productos.slice(3, 3 + visibles);
  const maxUnidades = productos[0]?.totalUnidadesVendidas || 1;
  const conteo = (id) => (id === 'todo' ? datos.productos.length : datos.productos.filter(p => p.categoria === id).length);

  return (
    <div className="bg-[#111] p-4 sm:p-6 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
        <div>
          <h2 className="text-xl font-black italic uppercase flex items-center gap-2 text-[#22D3EE]">
            <FaMedal /> Top Chemas
          </h2>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Los modelos que más se movieron</p>
        </div>

        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-gray-700 w-full sm:w-auto">
          <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior"
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer">
            <FaChevronLeft size={12} />
          </button>
          <div className="flex-1 sm:w-44 text-center">
            <span className="text-sm font-black text-white uppercase tracking-wide">{MESES[mes - 1]} {anio}</span>
            {esMesActual && <span className="block text-[9px] text-cyan-400 font-black uppercase tracking-widest leading-none">Mes actual</span>}
          </div>
          <button type="button" onClick={() => cambiarMes(1)} disabled={esMesActual} aria-label="Mes siguiente"
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent">
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-1 bg-black/60 p-1 rounded-xl border border-gray-800 mb-5 w-full sm:w-fit">
        {FILTROS.map(f => (
          <button key={f.id} type="button" onClick={() => { setFiltro(f.id); setVisibles(POR_PAGINA); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition cursor-pointer ${
              filtro === f.id ? 'bg-[#22D3EE] text-black shadow' : 'text-gray-400 hover:text-white'
            }`}>
            {f.label}
            {!loading && <span className={`ml-1.5 ${filtro === f.id ? 'text-black/60' : 'text-gray-600'}`}>{conteo(f.id)}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map(i => <div key={i} className="h-20 bg-gray-900 rounded-xl" />)}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">{[0, 1, 2].map(i => <div key={i} className="h-72 bg-gray-900 rounded-2xl" />)}</div>
        </div>
      ) : error ? (
        <div className="text-center py-16 border border-dashed border-red-900/50 rounded-2xl bg-black/50">
          <p className="text-red-400 font-bold uppercase text-xs mb-4">No se pudo cargar el ranking.</p>
          <button type="button" onClick={() => setRecarga(r => r + 1)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer">
            <FaRedo size={10} /> Reintentar
          </button>
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl text-gray-500 font-bold uppercase text-xs bg-black/50">
          No hay ventas {filtro !== 'todo' ? `de ${filtro} ` : ''}en {MESES[mes - 1].toLowerCase()} {anio}.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Resumen del mes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat icon={<FaTshirt />} label="Unidades" valor={resumen.unidades.toLocaleString('es-CR')} />
            <Stat icon={<FaMoneyBillWave />} label="Generado" valor={colonesCorto(resumen.dinero)} sub={colones(resumen.dinero)} />
            <Stat icon={<FaLayerGroup />} label="Modelos" valor={resumen.modelos} />
          </div>

          {/* Podio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 pt-6 sm:pt-10 items-stretch">
            {top3.map((prod, index) => {
              const m = MEDALLAS[index];
              const orden = index === 0 ? 'order-1 sm:order-2 z-10 sm:-translate-y-6' : index === 1 ? 'order-2 sm:order-1' : 'order-3';
              const porcentaje = resumen.unidades ? Math.round((prod.totalUnidadesVendidas / resumen.unidades) * 100) : 0;
              return (
                <div key={`${prod.nombre}-${index}`}
                  className={`relative flex flex-col bg-[#0a0a0a] rounded-2xl p-4 border-2 transition-transform duration-300 hover:-translate-y-1 h-full ${orden}`}
                  style={{ borderColor: m.color, boxShadow: m.glow }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center rounded-full font-black text-lg shadow-xl z-20 border-4 border-[#111]"
                    style={{ backgroundColor: m.color, color: m.texto }}>
                    {index === 0 ? <FaCrown size={18} /> : index + 1}
                  </div>

                  <div className="w-full aspect-square rounded-xl overflow-hidden mt-3 mb-3 relative shrink-0 border border-gray-800">
                    <Miniatura src={prod.imagen} alt={prod.nombre} preset="card" className="w-full h-full text-4xl" />
                    <span className="absolute top-2 left-2 text-[10px] uppercase font-black bg-black/80 backdrop-blur-md text-white px-2 py-1 rounded">
                      {prod.tipo || (prod.categoria === 'tacos' ? 'Tacos' : 'Pedido')}
                    </span>
                    {porcentaje > 0 && (
                      <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-1 rounded" style={{ backgroundColor: m.color, color: m.texto }}>
                        {porcentaje}%
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    <h3 className="font-bold text-white uppercase text-center line-clamp-2 text-xs sm:text-[13px]">{prod.nombre}</h3>
                    <Tallas tallas={prod.tallasTop} />
                    <div className="mt-auto grid grid-cols-2 bg-black/50 p-2.5 rounded-lg border border-gray-800 text-center">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase font-black block mb-0.5">Vendidas</span>
                        <span className="text-white font-black text-lg">{prod.totalUnidadesVendidas}</span>
                      </div>
                      <div className="border-l border-gray-800">
                        <span className="text-[9px] text-gray-500 uppercase font-black block mb-0.5">Generado</span>
                        <span className="text-green-500 font-black text-lg" title={colones(prod.totalDineroGenerado)}>{colonesCorto(prod.totalDineroGenerado)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resto del ranking */}
          {resto.length > 0 && (
            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Resto del ranking</h3>
              <ol className="space-y-2">
                {resto.map((prod, idx) => {
                  const puesto = idx + 4;
                  const ancho = Math.max(4, Math.round((prod.totalUnidadesVendidas / maxUnidades) * 100));
                  return (
                    <li key={`${prod.nombre}-${puesto}`}
                      className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-800 bg-[#0a0a0a] hover:bg-gray-900 transition">
                      <span className="w-7 text-center font-black text-sm text-gray-500 shrink-0">{puesto}</span>
                      <Miniatura src={prod.imagen} alt={prod.nombre} className="w-11 h-11 rounded-lg shrink-0 border border-gray-800 text-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-200 uppercase text-xs truncate">{prod.nombre}</h4>
                          {prod.tipo && <span className="hidden sm:inline text-[8px] uppercase font-black bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded shrink-0">{prod.tipo}</span>}
                        </div>
                        <div className="h-1.5 bg-gray-800/70 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-[#22D3EE]" style={{ width: `${ancho}%` }} />
                        </div>
                        <div className="hidden sm:block mt-1.5"><Tallas tallas={prod.tallasTop} compacto /></div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-white font-black text-sm flex items-center gap-1 justify-end">
                          {prod.totalUnidadesVendidas} <FaTshirt className="text-gray-600 text-[10px]" />
                        </span>
                        <span className="text-[10px] text-green-500/80 font-bold">{colonesCorto(prod.totalDineroGenerado)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {productos.length > 3 + visibles && (
                <button type="button" onClick={() => setVisibles(v => v + POR_PAGINA)}
                  className="w-full mt-3 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900 text-[11px] font-black uppercase tracking-widest transition cursor-pointer">
                  Ver más ({productos.length - 3 - visibles})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
