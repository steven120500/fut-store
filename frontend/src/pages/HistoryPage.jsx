
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
        // Enviamos la fecha solo si existe
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
      
      // Ajuste para leer los datos según tu backend
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setLogs(items);
    } catch (e) {
      console.error(e);
      toast.error("Error al sincronizar bitácora");
    } finally {
      setLoading(false);
    }
  };

  // Se dispara cada vez que cambias la fecha
  useEffect(() => {
    fetchHistory();
  }, [selectedDate]); 

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
      <div className="flex-grow pt-32 sm:pt-44 px-3 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* BOTÓN VOLVER */}
        <div className="flex justify-start mb-6">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest"
            >
                <FaArrowLeft /> Volver
            </button>
        </div>

        {/* HEADER Y FILTROS */}
        <div className="flex flex-col mb-10 border-b border-zinc-800 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#D4AF37] p-2.5 rounded-xl">
                <FaHistory className="text-black text-lg" />
            </div>
            <h1 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter">Bitácora de Cambios</h1>
          </div>

          {/* CONTENEDOR DE FILTROS REPARADO PARA MÓVIL */}
          <div className="flex flex-col gap-3 w-full">
            <div className="relative w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar producto o admin..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-xl pl-11 pr-4 py-3 text-sm text-black font-bold outline-none focus:border-[#D4AF37] transition-all placeholder:text-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-3 text-xs text-[#D4AF37] font-bold outline-none text-center"
                    style={{ colorScheme: 'dark' }} 
                />

                {isSuperUser && (
                <button 
                    onClick={handleClear} 
                    className="bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                >
                    LIMPIAR
                </button>
                )}
            </div>
          </div>
        </div>

        {/* LISTADO */}
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
             <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800 px-6">
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              {selectedDate ? "No hay cambios registrados en esta fecha" : "No hay actividad registrada"}
            </p>
            {selectedDate && (
                <button onClick={() => setSelectedDate("")} className="mt-4 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest underline">Ver todo el historial</button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 mb-24">
            {filteredLogs.map((log, idx) => (
              <div key={log._id || idx} className="bg-zinc-900/40 border border-zinc-800 p-4 sm:p-5 rounded-2xl hover:border-zinc-700 transition-all group">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-[#D4AF37]">
                            <FaUser size={10} />
                        </div>
                        <p className="font-black uppercase text-[9px] tracking-widest text-zinc-400">
                            <span className="text-white">{log.user}</span> <span className="font-normal lowercase mx-1 text-zinc-600">realizó</span> {log.action}
                        </p>
                    </div>
                    <span className="text-[7px] font-mono text-zinc-600 bg-black px-1.5 py-0.5 rounded border border-zinc-800 uppercase">ID: {log.productId?.substring(0,8) || log._id?.substring(16)}</span>
                  </div>

                  <h2 className="text-white font-bold text-sm sm:text-lg italic leading-tight group-hover:text-[#D4AF37] transition-colors">
                    {log.item || log.productName}
                  </h2>

                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-[8px] uppercase tracking-widest bg-black/40 w-fit px-2 py-1 rounded">
                    <FaCalendarAlt className="text-zinc-600" /> 
                    {log.date ? new Date(log.date).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                  </div>
                  
                  {log.details && (
                    <div className="mt-2 bg-black/60 p-3 rounded-xl border border-zinc-800/50">
                      <p className="text-[8px] text-zinc-600 uppercase font-black mb-2 tracking-widest">Cambios detectados:</p>
                      <pre className="text-[9px] text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                        {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
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