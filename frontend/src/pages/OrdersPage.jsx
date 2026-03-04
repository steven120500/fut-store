import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBoxOpen, FaClock, FaCheckCircle, FaMapMarkerAlt, FaPhone, FaEnvelope, FaTshirt, FaTrash, FaTruck, FaArrowLeft, FaPaperPlane, FaTimes } from 'react-icons/fa'; 
import { toast } from 'react-toastify'; 
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer'; 

const API_URL = import.meta.env.VITE_API_URL || 'https://fut-store.onrender.com/api';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('paid'); 
    const navigate = useNavigate(); 

    // Estados para el Modal de la Guía
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [sendingTracking, setSendingTracking] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders`);
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error cargando pedidos:", error);
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("¿Estás seguro de que quieres ELIMINAR este pedido permanentemente?")) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/orders/${orderId}`);
            setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
            toast.success("Pedido eliminado correctamente 🗑️");
        } catch (error) {
            console.error("Error eliminando:", error);
            toast.error("No se pudo eliminar el pedido.");
        }
    };

    const handleSendTracking = async () => {
        if (!trackingNumber.trim()) return toast.warning("Ingresa el número de guía.");
        setSendingTracking(true);

        try {
            await axios.post(`${API_URL}/orders/${selectedOrder._id}/send-tracking`, { 
                trackingNumber 
            });
            
            toast.success("¡Guía enviada al cliente con éxito!");
            
            setOrders(prev => prev.map(o => 
                o._id === selectedOrder._id ? { ...o, status: 'sent' } : o
            ));

            setShowTrackingModal(false);
            setTrackingNumber('');
            setSelectedOrder(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar el correo con la guía.");
        } finally {
            setSendingTracking(false);
        }
    };

    const openTrackingModal = (order) => {
        setSelectedOrder(order);
        setShowTrackingModal(true);
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'paid') return order.status === 'paid' || order.status === 'sent';
        else return order.status === 'pending' || order.status === 'failed';
    });

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <div className="flex-grow pt-24 px-4 md:px-8">
                <div className="max-w-6xl mx-auto">
                    
                    <div className="flex justify-start mb-4">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-sm"
                        >
                            <FaArrowLeft /> Volver
                        </button>
                    </div>

                    {/* ENCABEZADO Y PESTAÑAS */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-6 gap-4">
                        <h1 className="text-3xl font-bold text-[#D4AF37] flex items-center gap-3">
                            <FaBoxOpen /> Gestión de Pedidos
                        </h1>
                        
                        <div className="flex bg-[#111] p-1 rounded-full border border-gray-800">
                            <button 
                                onClick={() => setActiveTab('paid')}
                                className={`px-6 py-2 rounded-full font-bold transition flex items-center gap-2 text-sm ${
                                    activeTab === 'paid' 
                                    ? 'bg-green-500 text-black shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FaCheckCircle /> Ventas Confirmadas
                            </button>

                            <button 
                                onClick={() => setActiveTab('pending')}
                                className={`px-6 py-2 rounded-full font-bold transition flex items-center gap-2 text-sm ${
                                    activeTab === 'pending' 
                                    ? 'bg-yellow-600 text-black shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FaClock /> Carritos Abandonados
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-400 animate-pulse mt-10 uppercase font-black tracking-widest text-xs">Cargando base de datos...</p>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20 bg-[#111] rounded-xl border border-dashed border-gray-800">
                            <p className="text-xl text-gray-500 font-medium uppercase tracking-widest text-xs">
                                {activeTab === 'paid' ? "No hay ventas nuevas hoy." : "La papelera está vacía."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-8 mb-20"> 
                            {filteredOrders.map((order) => {
                                const esEnvioCorreos = order.shipping?.method?.toLowerCase().includes('correo');

                                return (
                                <div key={order._id} className={`bg-[#0a0a0a] border rounded-xl overflow-hidden transition-all relative ${
                                    activeTab === 'paid' ? 'border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.05)]' : 'border-gray-800 opacity-80'
                                }`}>
                                    
                                    <div className="bg-[#111] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 relative">
                                        <div className="flex flex-col pr-12 md:pr-0">
                                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Referencia de Orden</span>
                                            <span className="text-[#D4AF37] font-mono text-lg font-bold">{order.orderId}</span>
                                            <span className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="mt-4 md:mt-0 text-left md:text-right">
                                            <span className={`inline-block px-3 py-1 rounded text-10px font-black uppercase tracking-wide mb-2  ${
                                                order.status === 'sent' ? 'bg-blue-500 text-white' : 
                                                order.status === 'paid' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'
                                            }`}>
                                                {order.status === 'sent' ? 'ENVIADO' : order.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                                            </span>
                                            <p className="text-2xl font-black text-white">₡ {order.total?.toLocaleString()}</p>
                                        </div>

                                        {/* 🛠️ SOLUCIÓN: El botón de borrar solo existe si el modal NO está abierto 🛠️ */}
                                        {!showTrackingModal && (
                                            <button 
                                                onClick={() => handleDeleteOrder(order._id)}
                                                className="absolute top-28 right-4 bg-zinc-900 hover:bg-red-600 text-gray-500 hover:text-white p-2.5 rounded-lg transition-all shadow-lg border border-gray-800 hover:border-red-500 z-10"
                                                title="Eliminar Pedido"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-6 grid md:grid-cols-2 gap-8">
                                        <div className="flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2 tracking-widest">
                                                    <FaMapMarkerAlt /> Datos de Cliente
                                                </h3>
                                                <div className="space-y-3 text-sm">
                                                    <p className="flex items-start gap-3">
                                                        <span className="text-gray-400 w-5"><FaBoxOpen /></span>
                                                        <span className="font-bold text-lg text-white">{order.customer?.name}</span>
                                                    </p>
                                                    
                                                    {order.customer?.phone && (
                                                        <p className="flex items-center gap-3 font-mono font-bold text-[#D4AF37]">
                                                            <span className="text-gray-400 w-5"><FaPhone /></span>
                                                            {order.customer?.phone}
                                                        </p>
                                                    )}

                                                    <p className="flex items-center gap-3 text-gray-300">
                                                        <span className="text-gray-400 w-5"><FaEnvelope /></span>
                                                        {order.customer?.email}
                                                    </p>

                                                    {order.customer?.address && (
                                                        <div className="mt-3 p-3 bg-zinc-900/50 rounded border border-gray-800/50">
                                                            <p className="text-gray-500 text-[10px] uppercase font-black mb-1 tracking-widest">Dirección:</p>
                                                            <p className="text-gray-200 leading-relaxed text-xs">{order.customer?.address}</p>
                                                        </div>
                                                    )}

                                                    {order.shipping && (
                                                        <div className="mt-3 p-3 bg-black rounded border border-gray-800">
                                                            <p className="text-gray-500 text-[10px] uppercase font-black mb-1 flex items-center gap-1 tracking-widest">
                                                                <FaTruck size={10}/> Método:
                                                            </p>
                                                            <p className="text-[#D4AF37] font-black text-xs uppercase tracking-widest">
                                                                {order.shipping.method}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {activeTab === 'paid' && esEnvioCorreos && order.status !== 'sent' && (
                                                <button 
                                                    onClick={() => openTrackingModal(order)}
                                                    className="mt-6 w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                                                >
                                                    <FaPaperPlane /> AGREGAR GUÍA DE CORREOS
                                                </button>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2 tracking-widest">
                                                <FaTshirt /> Artículos
                                            </h3>
                                            <div className="space-y-3">
                                                {order.items?.map((item, index) => (
                                                    <div key={index} className="flex items-start gap-4 bg-zinc-900/30 p-3 rounded-xl border border-gray-800 hover:border-[#D4AF37]/50 transition">
                                                        <div className="w-14 h-14 bg-black rounded-lg border border-gray-800 overflow-hidden flex-shrink-0">
                                                            {item.image ? (
                                                                <img src={item.image} alt="Producto" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-700 text-[8px] uppercase font-black">N/A</div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex-1">
                                                            <p className="font-bold text-white text-xs uppercase tracking-tight leading-tight mb-1">{item.name}</p>
                                                            {item.version && (
                                                                <span className="inline-block bg-white text-black text-[9px] font-black px-1.5 rounded uppercase tracking-tighter mb-1">
                                                                    {item.version}
                                                                </span>
                                                            )}
                                                            <div className="flex gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                                <p>Talla: <span className="text-white">{item.size}</span></p>
                                                                {item.color && <p>Color: {item.color}</p>}
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="block text-gray-600 text-[8px] uppercase font-black">Cant.</span>
                                                            <span className="text-lg font-black text-white">{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE GUÍA */}
            {showTrackingModal && (
                <div className="fixed inset-0 z-500 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setShowTrackingModal(false)}
                            className="absolute bg-black text-white top-5 right-5 text-zinc-400 hover:text-black transition"
                        >
                            <FaTimes size={20} />
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-zinc-100 text-black rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTruck size={24} />
                            </div>
                            <h2 className="text-xl font-black italic uppercase text-black tracking-tighter">Enviar Guía</h2>
                            <p className="text-xs text-zinc-500 mt-2">
                                Cliente: <span className="text-black font-black uppercase">{selectedOrder?.customer?.name}</span>
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="text-[10px] font-black text-zinc-400 uppercase block mb-2 tracking-[0.2em]">Número de Guía de Correos</label>
                            <input 
                                type="text" 
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Ej: CR123456789"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-black focus:border-black outline-none font-mono tracking-widest uppercase text-sm transition-all"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowTrackingModal(false)}
                                className="flex-1 py-4 bg-black border border-zinc-200 text-zinc-500 rounded-xl font-bold hover:bg-zinc-50 transition uppercase text-[10px] tracking-widest"
                            >
                                CANCELAR
                            </button>
                            <button 
                                onClick={handleSendTracking}
                                disabled={sendingTracking}
                                className="flex-1 py-4 bg-black text-white rounded-xl font-black hover:bg-zinc-800 transition flex justify-center items-center gap-2 uppercase text-[10px] tracking-widest"
                            >
                                {sendingTracking ? 'ENVIANDO...' : <><FaPaperPlane /> ENVIAR</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default OrdersPage;