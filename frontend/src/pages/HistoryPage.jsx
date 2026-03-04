import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaHistory, FaTrash, FaUser, FaCalendarAlt, FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const API_BASE = "https://fut-store.onrender.com";

export default function HistoryPage({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // 👈 Vacío para que cargue TODO al inicio
  const navigate = useNavigate();

  const isSuperUser = user?.isSuperUser || false;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const roles = Array.isArray(user?.roles) ? user.roles.join(",") : "";
      
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Aumentamos para ver más registros
        ...(selectedDate && { date: selectedDate }), // Solo envía fecha si la eliges
        _: String(Date.now()), 
      });

      const res = await fetch(`${API_BASE}/api/history?` + params.toString(), {
        headers: {
          "Content-Type": "application/json",
          "x-super": isSuperUser ? "true" : "false",
          "x-roles": roles,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setLogs(items);
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDate, user]);

  const handleClear = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar TODO el historial?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-super": isSuperUser ? "true" : "false"
        },
      });
      if (!res.ok) throw new Error();
      toast.success("Historial limpiado.");
      setLogs([]);
    } catch {
      toast.error("Error al limpiar.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => 
      String(log.item || log.productName || "").toLowerCase().includes(term) ||
      String(log.user || "").toLowerCase().includes(term)
    );
  }, [logs, q]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <div className="flex-grow pt-44 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* BOTÓN VOLVER ESTILIZADO */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-600 transition-all font-bold text-xs mb-8 uppercase tracking-widest"
        >
          <FaArrowLeft /> Volver a la tienda
        </button>

        {/* HEADER DE PÁGINA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 border-b border-zinc-800 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#D4AF37] p-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <FaHistory className="text-black text-2xl" />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Bitácora de Cambios</h1>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* BUSCADOR OSCURO */}
            <div className="relative flex-1 md:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por producto o administrador..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
              />
            </div>

            {/* FILTRO FECHA OSCURO */}
            <div className="relative">
                <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-[#D4AF37] font-bold outline-none hover:border-[#D4AF37] transition-all cursor-pointer invert-[0.9] hue-rotate-180"
                />
            </div>

            {isSuperUser && (
              <button onClick={handleClear} className="bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-3 rounded-xl font-black text-xs hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">
                LIMPIAR
              </button>
            )}
          </div>
        </div>

        {/* LISTADO */}
        {loading ? (
          <div className="text-center py-20">
             <div className="inline-block w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-zinc-500 uppercase font-black tracking-widest text-xs">Sincronizando registros...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-32 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm mb-2">
              {q ? "Sin resultados para esta búsqueda" : "No hay cambios registrados en esta selección"}
            </p>
            {selectedDate && (
                <button onClick={() => setSelectedDate("")} className="text-[#D4AF37] text-xs font-bold underline">Ver todo el historial</button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 mb-24">
            {filteredLogs.map((log, idx) => (
              <div key={log._id || idx} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-600 transition-all group shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-zinc-800 text-[#D4AF37] group-hover:scale-110 transition-all flex-shrink-0">
                    <FaUser size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-black uppercase text-xs tracking-wider text-zinc-400">
                        <span className="text-white">{log.user}</span> <span className="font-normal lowercase mx-1 italic text-zinc-600">realizó un</span> <span className="text-[#D4AF37] underline decoration-zinc-800 underline-offset-4">{log.action}</span>
                      </p>
                      <span className="text-[10px] font-mono text-zinc-700 hidden sm:block bg-black px-2 py-1 rounded">ID: {log.productId?.substring(0,8) || log._id?.substring(18)}</span>
                    </div>
                    <p className="text-white font-bold text-xl mt-2 italic tracking-tight leading-tight">{log.item || log.productName}</p>
                    <p className="text-zinc-500 text-[10px] mt-4 flex items-center gap-2 font-black uppercase tracking-[0.1em]">
                      <FaCalendarAlt className="text-zinc-700" /> {log.date ? new Date(log.date).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                    </p>
                    
                    {log.details && (
                      <div className="mt-5 bg-black p-4 rounded-xl border border-zinc-800/50">
                        <p className="text-[9px] text-zinc-600 uppercase font-black mb-3 tracking-widest">Información adicional:</p>
                        <pre className="text-[11px] text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}