import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaTruck, FaTrash, FaWhatsapp, FaCreditCard, FaStore, FaExclamationTriangle, FaIdCard, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

// 🧠 CEREBRO DEL GAM
const GAM_CANTONES = {
  "1": ["1", "2", "3", "6", "8", "9", "10", "13", "14", "15", "18"], 
  "2": ["1", "2", "5", "8"], 
  "3": ["1", "2", "3", "4", "6", "8"], 
  "4": ["1", "2", "3", "4", "5", "6", "7", "8", "9"] 
};

const API_BASE = "https://fut-store.onrender.com"; 

export default function Checkout() {
  const { cart, cartTotal, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados de Ubicación
  const [provincias, setProvincias] = useState({});
  const [cantones, setCantones] = useState({});
  const [distritos, setDistritos] = useState({});
  
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");

  // Estados de Envío y Pago
  const [tipoEntrega, setTipoEntrega] = useState("envio");
  const [opcionesEnvio, setOpcionesEnvio] = useState([]); 
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  
  // 🏆 CAMBIO: Arrancamos con "sinpe" por defecto mientras se arregla la pasarela
  const [metodoPago, setMetodoPago] = useState("sinpe");
  
  const [loadingPay, setLoadingPay] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // 🏆 NUEVOS ESTADOS PARA VALIDACIÓN PROACTIVA Y CÉDULA
  const [verifyingCartOnLoad, setVerifyingCartOnLoad] = useState(true);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loadingCedula, setLoadingCedula] = useState(false);

  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    telefono: '',
    direccionExacta: '',
    correo: ''
  });

  // --- DETECTAR REGRESO DE TILOPAY ---
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const orderId = query.get("order");
    const tiloPayResponse = query.get("Response") || query.get("response") || query.get("code");

    if (orderId && tiloPayResponse) {
      if (tiloPayResponse === "1") {
        confirmarPagoBackend(orderId);
      } else {
        toast.error("El pago fue cancelado o la tarjeta fue rechazada.");
        navigate('/checkout', { replace: true });
      }
    }
  }, [location, navigate]);

  const confirmarPagoBackend = async (orderId) => {
    try {
      setVerifyingPayment(true);
      const res = await fetch(`${API_BASE}/api/tilopay/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      const data = await res.json();

      if (data.success || data.status === 'paid') {
        toast.success("¡Pago exitoso! Te enviamos los detalles por correo.");
        clearCart(); 
        navigate("/"); 
      } else {
        toast.warning("Pago recibido, pero hubo un error actualizando el estado.");
        navigate("/"); 
      }
      
    } catch (error) {
      console.error("Error confirmando:", error);
      toast.error("Error de conexión al verificar el pago.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // 1. Cargar Provincias
  useEffect(() => {
    fetch('https://ubicaciones.paginasweb.cr/provincias.json')
      .then(res => res.json())
      .then(data => setProvincias(data))
      .catch(err => console.error(err));
  }, []);

  // 🇨🇷 EFECTO PARA AUTOCOMPLETAR NOMBRE MEDIANTE LA CÉDULA (TSE / HACIENDA)
  useEffect(() => {
    const checkCedulaTSE = async () => {
      const cleanCedula = formData.cedula.replace(/\D/g, '');
      if (cleanCedula.length === 9) {
        setLoadingCedula(true);
        try {
          const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanCedula}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.nombre) {
              setFormData(prev => ({ ...prev, nombre: data.nombre }));
              toast.success("¡Nombre autocompletado exitosamente!");
            }
          }
        } catch (error) {
          console.error("No se pudo obtener el nombre de la cédula:", error);
        } finally {
          setLoadingCedula(false);
        }
      }
    };
    
    checkCedulaTSE();
  }, [formData.cedula]);

  // 🏆 EFECTO DE VALIDACIÓN PROACTIVA DEL CARRITO
  useEffect(() => {
    const checkCartStock = async () => {
      if (cart.length === 0) {
        setVerifyingCartOnLoad(false);
        setOutOfStockItems([]);
        return;
      }

      setVerifyingCartOnLoad(true);
      const invalidItems = [];

      try {
        for (const item of cart) {
          const res = await fetch(`${API_BASE}/api/products/${item._id || item.id}`);
          if (res.ok) {
            const dbProduct = await res.json();
            const cleanSize = item.selectedSize.trim().toLowerCase();
            const claveReal = Object.keys(dbProduct.stock || {}).find(k => k.trim().toLowerCase() === cleanSize);
            const stockDisponible = claveReal ? Number(dbProduct.stock[claveReal]) : 0;

            if (stockDisponible < item.quantity) {
              invalidItems.push(`"${item.name}" (Talla: ${item.selectedSize})`);
            }
          }
        }
        setOutOfStockItems(invalidItems);
      } catch (error) {
        console.error("Error validando el carrito al cargar:", error);
      } finally {
        setVerifyingCartOnLoad(false);
      }
    };

    checkCartStock();
  }, [cart]);

  const handleProvinciaChange = (e) => {
    const id = e.target.value;
    setSelectedProvincia(id);
    setSelectedCanton("");
    setSelectedDistrito("");
    setCantones({});
    setDistritos({});
    setOpcionesEnvio([]);
    setEnvioSeleccionado(null);
    if (id) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${id}/cantones.json`)
        .then(res => res.json())
        .then(data => setCantones(data));
    }
  };

  const handleCantonChange = (e) => {
    const idCanton = e.target.value;
    setSelectedCanton(idCanton);
    setSelectedDistrito("");
    setDistritos({});

    if (idCanton && selectedProvincia) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${selectedProvincia}/canton/${idCanton}/distritos.json`)
        .then(res => res.json())
        .then(data => setDistritos(data));

      const esZonaGam = GAM_CANTONES[selectedProvincia]?.includes(idCanton);
      const nuevasOpciones = [];

      nuevasOpciones.push({
        id: 'correos',
        nombre: 'Correos de Costa Rica',
        precio: 3500,
        detalle: esZonaGam ? 'Tarda entre 1-2 dias en llegar' : 'Entrega 1-2 días hábiles'
      });

      if (esZonaGam) {
        const esCartago = selectedProvincia === "3";
        const precioMensajero = esCartago ? 5000 : 4000;
        nuevasOpciones.push({
          id: 'mensajero',
          nombre: 'Mensajero Privado',
          precio: precioMensajero,
          detalle: 'Entrega Lunes, Miercoles, Viernes o Sabado (Solo dentro del GAM)'
        });
      }

      setOpcionesEnvio(nuevasOpciones);
      setEnvioSeleccionado(nuevasOpciones[0]);
    }
  };

  const handleTipoEntregaChange = (tipo) => {
    setTipoEntrega(tipo);
    if (tipo === "recoger") {
      setEnvioSeleccionado(null);
    } else {
      if (opcionesEnvio.length > 0) {
          setEnvioSeleccionado(opcionesEnvio[0]);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCedulaChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, cedula: rawValue });
  };

  const handlePhoneChange = (e) => {
    let rawValue = e.target.value;
    let numbersOnly = rawValue.replace(/\D/g, '');
    
    if (numbersOnly.startsWith('506') && numbersOnly.length > 8) {
      numbersOnly = numbersOnly.substring(3);
    }
    
    numbersOnly = numbersOnly.slice(0, 8);
    setFormData({ ...formData, telefono: numbersOnly });
  };

  const handleProcessOrder = async (e) => {
    e.preventDefault();
    
    if (outOfStockItems.length > 0) return;

    if (!formData.cedula || !formData.nombre || !formData.telefono || !formData.correo) {
      return toast.warning("Por favor llena todos tus datos de contacto.");
    }
    
    if (formData.telefono.length !== 8) {
      return toast.warning("El teléfono debe tener exactamente 8 números.");
    }

    if (tipoEntrega === "envio") {
        if (!selectedProvincia || !selectedCanton || !selectedDistrito || !formData.direccionExacta) {
            return toast.warning("Por favor completa toda la información de envío.");
        }
        if (!envioSeleccionado) {
            return toast.warning("Selecciona un método de envío.");
        }
    }

    setLoadingPay(true);

    try {
      for (const item of cart) {
        const res = await fetch(`${API_BASE}/api/products/${item._id || item.id}`);
        if (!res.ok) throw new Error("Error al consultar el producto");
        
        const dbProduct = await res.json();
        const cleanSize = item.selectedSize.trim().toLowerCase();
        const claveReal = Object.keys(dbProduct.stock || {}).find(k => k.trim().toLowerCase() === cleanSize);
        const stockDisponible = claveReal ? Number(dbProduct.stock[claveReal]) : 0;

        if (stockDisponible < item.quantity) {
          toast.error(`¡Ups! Alguien acaba de comprar la última unidad de "${item.name}" en talla ${item.selectedSize}.`);
          setLoadingPay(false);
          setOutOfStockItems(prev => [...prev, `"${item.name}" (Talla: ${item.selectedSize})`]);
          return; 
        }
      }

      const precioEnvioFinal = tipoEntrega === "envio" && envioSeleccionado ? envioSeleccionado.precio : 0;
      const totalFinal = cartTotal + precioEnvioFinal;
      
      const nombreProvincia = provincias[selectedProvincia] || "";
      const nombreCanton = cantones[selectedCanton] || "";
      const nombreDistrito = distritos[selectedDistrito] || "";
      
      const direccionFinal = tipoEntrega === "recoger" 
          ? "Recoger en el Local" 
          : `${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}. ${formData.direccionExacta}`;

      const metodoEnvioFinal = tipoEntrega === "recoger" ? "Recoger en el Local" : envioSeleccionado?.nombre;

      if (metodoPago === 'sinpe') {
          let mensaje = `*NUEVO PEDIDO - FUTSTORE*\n`;
          mensaje += `────────────────\n`;
          mensaje += `Cédula: ${formData.cedula}\n`;
          mensaje += `Cliente: ${formData.nombre}\n`;
          mensaje += `Tel: ${formData.telefono}\n`;
          mensaje += `Correo: ${formData.correo}\n`;
          mensaje += `Tipo: ${tipoEntrega === 'recoger' ? '🏬 Recoger en local' : '🚚 Envío a domicilio'}\n`;
          if(tipoEntrega === 'envio') {
              mensaje += `Ubicación: ${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}\n`;
              mensaje += `Detalle: ${formData.direccionExacta}\n`;
          }
          mensaje += `────────────────\n`;
          
          mensaje += `*MÉTODO DE ENTREGA:*\n`;
          mensaje += `➡ ${metodoEnvioFinal}\n`;
          mensaje += `Costo envío: ₡${precioEnvioFinal.toLocaleString()}\n`;
          mensaje += `────────────────\n`;

          mensaje += `*DETALLE DE PRODUCTOS:*\n`;
          cart.forEach(item => {
            const version = item.type ? `[${item.type}]` : '';
            const precioItem = (item.discountPrice || item.price).toLocaleString();
            mensaje += `*${item.quantity}x ${item.name}* ${version}\n`;
            mensaje += `   └ Talla: ${item.selectedSize}\n`;
            mensaje += `   └ Precio c/u: ₡${precioItem}\n`;
          });
          
          mensaje += `────────────────\n`;
          mensaje += `*TOTAL A PAGAR: ₡${totalFinal.toLocaleString()}*\n`;
          mensaje += `*Método de Pago:* SINPE MÓVIL\n\n`;
          mensaje += `Quedo atento a la cuenta SINPE para enviar el comprobante. ✅`;

          window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
          setLoadingPay(false);
          return;
      }

      /* ⛔ TEMPORALMENTE DESHABILITADO POR MANTENIMIENTO DE PASARELA
      if (metodoPago === 'tarjeta') {
          const orderData = {
            cliente: {
              cedula: formData.cedula,
              nombre: formData.nombre,
              telefono: formData.telefono,
              correo: formData.correo,
              direccion: direccionFinal
            },
            productos: cart.map(item => ({
              _id: item._id || item.id,
              nombre: item.name,
              precio: item.discountPrice || item.price,
              cantidad: item.quantity,
              tallaSeleccionada: item.selectedSize,
              version: item.type,
              imgs: [item.imageSrc]
            })),
            envio: {
              metodo: metodoEnvioFinal,
              precio: precioEnvioFinal
            },
            total: totalFinal
          };

          const res = await fetch(`${API_BASE}/api/tilopay/create-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Error al crear pago");
          if (data.url) window.location.href = data.url; 
          else { toast.error("No se recibió el link de pago."); setLoadingPay(false); }
      }
      */

    } catch (error) {
      console.error("DETALLE DEL ERROR:", error);
      toast.error("Hubo un problema de conexión al procesar la orden. Intenta de nuevo.");
      setLoadingPay(false);
    }
  };

  if (verifyingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#D4AF37] mb-6"></div>
        <h2 className="text-2xl font-bold text-[#D4AF37] animate-pulse">Verificando tu pago...</h2>
        <p className="text-gray-400 mt-2">Por favor no cierres esta ventana.</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Tu carrito está vacío 🛒</h2>
        <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const precioEnvioActual = tipoEntrega === "envio" && envioSeleccionado ? envioSeleccionado.precio : 0;
  const granTotal = cartTotal + precioEnvioActual;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* IZQUIERDA: FORMULARIO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-black font-medium">
            <FaArrowLeft /> Volver
          </button>
          
          <h2 className="text-2xl font-black italic uppercase mb-6">Finalizar Compra</h2>

          {outOfStockItems.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center gap-2 font-bold mb-2">
                <FaExclamationTriangle />
                <span>¡Atención! Hay artículos agotados en tu carrito:</span>
              </div>
              <ul className="list-disc ml-6 text-sm mb-2 font-medium">
                {outOfStockItems.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
              <p className="text-sm">Por favor, elimínalos del resumen de la derecha para poder continuar con tu compra.</p>
            </div>
          )}
          
          <form onSubmit={handleProcessOrder} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              
              {/* 🏆 CAMPO CÉDULA INTELIGENTE */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                  <span>Cédula (Autocompleta nombre)</span>
                  {loadingCedula && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-pulse"><FaSpinner className="animate-spin"/> Buscando TSE...</span>}
                </label>
                <div className="relative mt-1">
                  <input 
                    type="text" 
                    name="cedula" 
                    value={formData.cedula}
                    onChange={handleCedulaChange} 
                    className="w-full border p-2 pl-9 rounded focus:ring-2 ring-black outline-none font-mono text-sm" 
                    placeholder="Ej: 101110111" 
                    maxLength="9"
                    required 
                  />
                  <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={formData.nombre}
                    onChange={handleChange} 
                    className="w-full border p-2 rounded focus:ring-2 ring-black outline-none font-bold" 
                    placeholder={loadingCedula ? "Autocompletando..." : "Tu nombre completo"} 
                    required 
                  />
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                    <input 
                      type="tel" 
                      name="telefono" 
                      value={formData.telefono}
                      onChange={handlePhoneChange} 
                      className="w-full border p-2 rounded focus:ring-2 ring-black outline-none font-mono" 
                      placeholder="88888888" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Correo</label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 ring-black outline-none" placeholder="juan@email.com" required />
                  </div>
              </div>
            </div>

            <div className="border-t pt-4">
                <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaMapMarkerAlt/> ¿Cómo quieres recibir tu pedido?</p>
                <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 ${tipoEntrega === 'envio' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                        <input type="radio" name="tipoEntrega" value="envio" className="hidden" checked={tipoEntrega === 'envio'} onChange={() => handleTipoEntregaChange('envio')} />
                        <FaTruck size={24}/>
                        <span className="font-bold text-xs text-center">Envío a Domicilio</span>
                    </label>
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 ${tipoEntrega === 'recoger' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                        <input type="radio" name="tipoEntrega" value="recoger" className="hidden" checked={tipoEntrega === 'recoger'} onChange={() => handleTipoEntregaChange('recoger')} />
                        <FaStore size={24}/>
                        <span className="font-bold text-xs text-center">Recoger en el Local</span>
                    </label>
                </div>
            </div>

            {tipoEntrega === "envio" && (
                <div className="border-t pt-4 animate-fade-in">
                  <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaMapMarkerAlt/> Dirección de Envío</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <select className="border p-2 rounded bg-gray-50 text-sm" value={selectedProvincia} onChange={handleProvinciaChange} required>
                      <option value="">Provincia</option>
                      {Object.entries(provincias).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                    </select>
                    <select className="border p-2 rounded bg-gray-50 text-sm" value={selectedCanton} onChange={handleCantonChange} disabled={!selectedProvincia} required>
                      <option value="">Cantón</option>
                      {Object.entries(cantones).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                    </select>
                    <select className="border p-2 rounded bg-gray-50 text-sm" value={selectedDistrito} onChange={(e) => setSelectedDistrito(e.target.value)} disabled={!selectedCanton} required>
                      <option value="">Distrito</option>
                      {Object.entries(distritos).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                    </select>
                  </div>
                  <textarea name="direccionExacta" value={formData.direccionExacta} onChange={handleChange} rows="2" className="w-full border p-2 rounded text-sm focus:ring-2 ring-black outline-none" placeholder="Señas exactas..." required></textarea>
                </div>
            )}

            {tipoEntrega === "envio" && opcionesEnvio.length > 0 && (
              <div className="border-t pt-4 animate-fade-in">
                <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaTruck/> Método de Envío</p>
                <div className="space-y-3">
                  {opcionesEnvio.map((opcion) => (
                    <label key={opcion.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${envioSeleccionado?.id === opcion.id ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                      <input type="radio" name="envio" className="accent-black w-5 h-5 mr-3" checked={envioSeleccionado?.id === opcion.id} onChange={() => setEnvioSeleccionado(opcion)} />
                      <div className="flex-1">
                        <div className="flex justify-between font-bold text-sm">
                          <span>{opcion.nombre}</span>
                          <span>₡{opcion.precio.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{opcion.detalle}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
                <p className="font-bold text-sm mb-3 flex items-center gap-2">💳 Método de Pago</p>
                <div className="grid grid-cols-1 gap-4">
                    {/* ⛔ TEMPORALMENTE DESHABILITADO POR MANTENIMIENTO DE PASARELA
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 ${metodoPago === 'tarjeta' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                        <input type="radio" name="pago" value="tarjeta" className="hidden" checked={metodoPago === 'tarjeta'} onChange={() => setMetodoPago('tarjeta')} />
                        <FaCreditCard size={24}/>
                        <span className="font-bold text-xs">Tarjeta</span>
                    </label>
                    */}
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 ${metodoPago === 'sinpe' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                        <input type="radio" name="pago" value="sinpe" className="hidden" checked={metodoPago === 'sinpe'} onChange={() => setMetodoPago('sinpe')} />
                        <FaWhatsapp size={24}/>
                        <span className="font-bold text-xs">SINPE-Movil</span>
                    </label>
                </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loadingPay || verifyingCartOnLoad || outOfStockItems.length > 0 || loadingCedula} 
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition shadow-lg mt-6 
                ${(loadingPay || verifyingCartOnLoad || outOfStockItems.length > 0 || loadingCedula) ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
            >
              {verifyingCartOnLoad ? "Revisando disponibilidad..." 
                  : loadingPay ? "Procesando..." 
                  : loadingCedula ? "Buscando cliente..."
                  : outOfStockItems.length > 0 ? "QUITA LOS AGOTADOS"
                  : metodoPago === 'sinpe' ? "ENVIAR PEDIDO POR WHATSAPP" 
                  : "PAGAR CON TARJETA"}
            </button>
          </form>
        </div>

        {/* DERECHA: RESUMEN */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-28">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Resumen</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {cart.map((item, index) => {
              const isExhausted = outOfStockItems.some(errText => errText.includes(item.name) && errText.includes(item.selectedSize));

              return (
                  <div key={`${item._id}-${index}`} className={`flex gap-4 items-start border-b pb-4 ${isExhausted ? 'bg-red-50 p-2 rounded border-red-200' : 'border-gray-50'}`}>
                    <img src={item.imageSrc} className="w-16 h-16 object-contain rounded border bg-white" alt={item.name} />
                    <div className="flex-1">
                        <p className={`font-bold text-xs uppercase ${isExhausted ? 'text-red-700' : ''}`}>{item.name}</p>
                        <p className="text-[10px] text-gray-500">Talla: {item.selectedSize} | Cant: {item.quantity}</p>
                        <p className="font-bold text-sm">₡{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</p>
                        {isExhausted && <span className="text-[10px] font-bold text-red-600">Agotado</span>}
                    </div>
                    <button onClick={() => removeFromCart(item._id || item.id, item.selectedSize)} className="text-gray-400 hover:text-red-600 p-2"><FaTrash size={14}/></button>
                  </div>
              )
            })}
          </div>

          <div className="border-t mt-6 pt-4 space-y-2 text-sm font-bold">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₡{cartTotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Envío</span><span>₡{precioEnvioActual.toLocaleString()}</span></div>
            <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-dashed"><span>TOTAL</span><span>₡{granTotal.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}