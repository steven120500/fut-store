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
  const [selectedDate, setSelectedDate] = useState(""); 
  const navigate = useNavigate();

  const isSuperUser = user?.isSuperUser || false;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const roles = Array.isArray(user?.roles) ? user.roles.join(",") : "";
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
        ...(selectedDate && { date: selectedDate }),
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
      toast.error("Error al sincronizar bitácora");
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
        headers: { "Content-Type": "application/json", "x-super": isSuperUser ? "true" : "false" },
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
      <div className="flex-grow pt-40 sm:pt-44 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* BOTÓN VOLVER */}
        <div className="flex justify-start mb-8">
            <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-3 px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-500 transition-all font-bold text-xs uppercase tracking-widest shadow-lg"
            >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
            Volver
            </button>
        </div>

        {/* HEADER DE PÁGINA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 border-b border-zinc-800 pb-8 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-[#D4AF37] p-3.5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                <FaHistory className="text-black text-2xl" />
            </div>
            <div>
                <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none">Bitácora</h1>
                <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mt-1">Control de cambios</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 md:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar producto o administrador..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#D4AF37] outline-none transition-all"
              />
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-[#D4AF37] font-bold outline-none hover:border-[#D4AF37] transition-all cursor-pointer"
              style={{ colorScheme: 'dark' }} 
            />

            {isSuperUser && (
              <button onClick={handleClear} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-3 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all uppercase tracking-[0.2em]">
                LIMPIAR
              </button>
            )}
          </div>
        </div>

        {/* LISTADO */}
        {loading ? (
          <div className="text-center py-24 flex flex-col items-center">
             <div className="w-10 h-10 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-zinc-500 uppercase font-black tracking-[0.2em] text-[10px]">Leyendo Base de Datos...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-32 bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-800">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm mb-4">
              {q ? "No se encontraron coincidencias" : "No hay registros disponibles"}
            </p>
            {selectedDate && (
                <button onClick={() => setSelectedDate("")} className="text-[#D4AF37] text-xs font-bold underline hover:text-white transition-colors">Mostrar todo el historial</button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 mb-32">
            {filteredLogs.map((log, idx) => (
              <div key={log._id || idx} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-[#D4AF37]/30 transition-all group">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-xl flex-shrink-0">
                    <FaUser size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                      <p className="font-black uppercase text-xs tracking-wider text-zinc-400">
                        <span className="text-white bg-zinc-800 px-2 py-1 rounded-md">{log.user}</span> 
                        <span className="font-normal lowercase mx-2 italic text-zinc-600">realizó</span> 
                        <span className="text-[#D4AF37] font-bold border-b border-zinc-800">{log.action}</span>
                      </p>
                      <span className="text-[10px] font-mono text-zinc-700 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
                        ID: {log.productId?.substring(0,10) || log._id?.substring(14)}
                      </span>
                    </div>

                    <h2 className="text-white font-black text-xl sm:text-2xl italic tracking-tight leading-tight mb-4 group-hover:text-[#D4AF37] transition-colors">
                        {log.item || log.productName}
                    </h2>

                    <div className="flex items-center gap-2 text-white font-bold text-xs bg-zinc-900/80 w-fit px-3 py-1.5 rounded-lg border border-zinc-800">
                      <FaCalendarAlt className="text-[#D4AF37]" /> 
                      {log.date ? new Date(log.date).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                    </div>
                    
                    {log.details && (
                      <div className="mt-6 bg-black/80 p-5 rounded-2xl border border-zinc-800/60 shadow-inner">
                        <p className="text-[9px] text-zinc-500 uppercase font-black mb-3 tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1 h-1 bg-[#D4AF37] rounded-full"></span> 
                            Cambios Realizados
                        </p>
                        <pre className="text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
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