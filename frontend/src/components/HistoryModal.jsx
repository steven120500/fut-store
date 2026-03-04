import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaHistory, FaTrash, FaUser, FaCalendarAlt, FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const API_BASE = "https://fut-store.onrender.com";

/* --- Utilidades de fecha --- */
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }
function ymdLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${y}-${m}-${dd}`;
}

export default function HistoryPage({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => ymdLocal());
  const navigate = useNavigate();

  const isSuperUser = user?.isSuperUser || false;

  // Carga de datos con los parámetros que usaba tu modal antiguo
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const roles = Array.isArray(user?.roles) ? user.roles.join(",") : "";
      
      const params = new URLSearchParams({
        page: "1",
        limit: "500",
        date: selectedDate, // 👈 Tu backend filtra por este día
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
      
      // Manejo de la estructura de respuesta que usa tu backend
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setLogs(items);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDate, user]); // Se recarga si cambias la fecha

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

  // Filtro de búsqueda local (lo que escribes en el input)
  const filteredLogs = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => 
      String(log.item || log.productName || "").toLowerCase().includes(term) ||
      String(log.user || "").toLowerCase().includes(term)
    );
  }, [logs, q]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-grow pt-44 px-4 md:px-8 max-w-6xl mx-auto w-full">
        
        {/* BOTÓN VOLVER */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-400 hover:text-[#D4AF37] transition font-bold text-sm mb-6"
        >
          <FaArrowLeft /> Volver
        </button>

        {/* HEADER DE PÁGINA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-6 gap-4">
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
            <FaHistory className="text-[#D4AF37]" /> Bitácora de Cambios
          </h1>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* BUSCADOR */}
            <div className="relative flex-1 md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-3" />
              <input
                type="text"
                placeholder="Buscar producto o admin..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-[#111] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* FILTRO FECHA */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#111] border border-gray-800 rounded-lg px-4 py-2 text-sm text-[#D4AF37] font-bold outline-none"
            />

            {isSuperUser && (
              <button onClick={handleClear} className="bg-red-600/10 border border-red-600 text-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-600 hover:text-white transition">
                LIMPIAR
              </button>
            )}
          </div>
        </div>

        {/* LISTADO */}
        {loading ? (
          <div className="text-center py-20 animate-pulse text-gray-500 uppercase tracking-widest font-black">Sincronizando registros...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-32 bg-[#0a0a0a] rounded-2xl border border-dashed border-gray-800">
            <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">
              {q ? "No hay resultados para esta búsqueda" : "No hay cambios registrados en esta fecha"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 mb-20">
            {filteredLogs.map((log, idx) => (
              <div key={log._id || idx} className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-xl hover:border-[#D4AF37]/40 transition group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center border border-gray-800 text-[#D4AF37] group-hover:border-[#D4AF37] transition flex-shrink-0">
                    <FaUser size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-black uppercase text-xs tracking-wider truncate">
                        {log.user} <span className="font-normal text-gray-500 lowercase mx-1">realizó un</span> <span className="text-[#D4AF37]">{log.action}</span>
                      </p>
                      <span className="text-[10px] font-mono text-gray-700 hidden sm:block">REF: {log._id?.substring(18)}</span>
                    </div>
                    <p className="text-white font-bold text-xl mt-1 italic tracking-tight">{log.item || log.productName}</p>
                    <p className="text-gray-500 text-[10px] mt-3 flex items-center gap-2 font-black uppercase tracking-widest">
                      <FaCalendarAlt /> {log.date ? new Date(log.date).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                    </p>
                    
                    {log.details && (
                      <div className="mt-4 bg-black/50 border border-gray-900 rounded-lg p-3">
                        <p className="text-[9px] text-gray-600 uppercase font-black mb-2 tracking-widest">Detalles técnicos:</p>
                        <pre className="text-[11px] text-gray-400 font-mono overflow-x-auto">
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