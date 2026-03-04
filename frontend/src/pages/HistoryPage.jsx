import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHistory, FaTrash, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';

// Asegúrate de que esta URL sea la de tu backend en Render
const API_BASE = "https://fut-store.onrender.com";

const HistoryPage = ({ user }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const isSuperUser = user?.isSuperUser || false;

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // 🛠️ Cambiamos a la ruta completa del backend
            const res = await axios.get(`${API_BASE}/api/history`);
            setHistory(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* 🗑️ Se quitó el Header de aquí porque App.js ya lo pone */}
            
            <div className="flex-grow pt-40 px-4 md:px-8 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                    <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
                        <FaHistory className="text-[#D4AF37]" /> Historial de Cambios
                    </h1>

                    {isSuperUser && (
                        <button 
                            onClick={async () => {
                                if(window.confirm("¿Limpiar todo?")) {
                                    await axios.delete(`${API_BASE}/api/history`);
                                    setHistory([]);
                                    toast.success("Historial borrado");
                                }
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs"
                        >
                            LIMPIAR TODO
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Cargando registros...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800">
                        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">No hay actividad registrada</p>
                    </div>
                ) : (
                    <div className="space-y-4 mb-20">
                        {history.map((log) => (
                            <div key={log._id} className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-xl hover:border-[#D4AF37]/50 transition">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center border border-gray-700 text-[#D4AF37]">
                                        <FaUser size={14} />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase text-sm text-white">
                                            {log.user} <span className="font-normal text-gray-500 lowercase mx-2">realizó:</span> {log.action}
                                        </p>
                                        <p className="text-[#D4AF37] font-bold text-lg">{log.productName}</p>
                                        <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-2 uppercase tracking-widest">
                                            <FaCalendarAlt /> {new Date(log.createdAt).toLocaleString()}
                                        </p>
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
};

export default HistoryPage;