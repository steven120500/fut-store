import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHistory, FaArrowLeft, FaTrash, FaUser, FaCalendarAlt, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'https://fut-store.onrender.com/api';

const HistoryPage = ({ user, onLogout }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const isSuperUser = user?.isSuperUser || false;

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/history`);
            setHistory(res.data);
        } catch (error) {
            toast.error("Error cargando historial");
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm("¿Estás seguro de eliminar TODO el historial permanentemente?")) return;
        try {
            await axios.delete(`${API_URL}/history`, { headers: { 'x-user': user.username } });
            setHistory([]);
            toast.success("Historial limpiado correctamente");
        } catch (error) {
            toast.error("Solo el Superadmin puede hacer esto");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Header user={user} onLogout={onLogout} />
            
            <div className="flex-grow pt-32 px-4 md:px-8 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#D4AF37] flex items-center gap-2 mb-2 transition">
                            <FaArrowLeft /> Volver
                        </button>
                        <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
                            <FaHistory className="text-[#D4AF37]" /> Historial de Cambios
                        </h1>
                    </div>

                    {isSuperUser && (
                        <button 
                            onClick={handleClearHistory}
                            className="bg-red-600/10 border border-red-600 text-red-500 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition flex items-center gap-2 font-bold text-sm"
                        >
                            <FaTrash /> LIMPIAR TODO
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-gray-500">Cargando bitácora...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800">
                        <p className="text-gray-500 font-bold">No hay registros de actividad todavía.</p>
                    </div>
                ) : (
                    <div className="space-y-4 mb-20">
                        {history.map((log) => (
                            <div key={log._id} className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-xl hover:border-[#D4AF37]/50 transition group relative">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center border border-gray-700 text-[#D4AF37]">
                                            <FaUser size={14} />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm tracking-tight text-white">
                                                {log.user} <span className="font-normal text-gray-500 lowercase mx-2">realizó un</span> {log.action}
                                            </p>
                                            <p className="text-[#D4AF37] font-bold text-lg">{log.productName}</p>
                                            <p className="text-gray-400 text-xs mt-1 flex items-center gap-2">
                                                <FaCalendarAlt /> {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="md:text-right">
                                        <span className="text-[10px] font-black bg-gray-800 px-2 py-1 rounded text-gray-400 uppercase tracking-widest">ID: {log.productId}</span>
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