import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaArrowRight, FaCheck, FaBoxOpen, FaTruck, FaStore, 
  FaTimes, FaImage, FaSearch, FaMoneyBillWave, FaUserTie, FaIdCard, FaTrash, FaTags, FaChevronDown, FaChevronUp, FaFilePdf, FaSpinner, FaTshirt, FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = "https://fut-store.onrender.com";

const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (typeof file === 'string') return resolve(file); 
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export default function ApartadosPage({ user }) {
  const navigate = useNavigate();
  const [apartados, setApartados] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [apartadoSeleccionado, setApartadoSeleccionado] = useState(null);
  const [apartadoToDelete, setApartadoToDelete] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [productosStock, setProductosStock] = useState([]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null); 
  const searchRef = useRef(null);

  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const employeeDropdownRef = useRef(null);
  const listaEmpleados = [
    "LaR Delfiow", "Justin Lobo", "Carlos Lobo", "Alonso Lobo", 
    "Dylan Gomez", "Steven Corrales", "Keylor Gómez"
  ];

  const currentUser = user?.firstName || user?.username || 'Steven Corrales';

  const [form, setForm] = useState({
    vendedor: currentUser, 
    cliente: '',
    cedula: '',
    telefono: '',
    abono: '',
    productos: [
      {
        id: Date.now(),
        tipoPedido: 'stock', 
        busqueda: '',
        productoObj: null, 
        descripcionManual: '',
        nombreCamiseta: '', 
        numeroCamiseta: '', 
        version: 'Player', 
        parches: '', 
        talla: 'L',
        cantidad: 1,
        precioItem: '',
        type: '',
        imagen1: null,      // 👈 Foto 1 específica por producto
        imagen2: null,      // 👈 Foto 2 específica por producto
        previewImg1: null,
        previewImg2: null 
      }
    ]
  });
  
  const [buscandoCedula, setBuscandoCedula] = useState(false); 

  // 📡 CARGAR APARTADOS DESDE MONGODB
  useEffect(() => {
    const fetchApartados = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/apartados`);
        if (res.ok) {
          const data = await res.json();
          setApartados(data);
        }
      } catch (error) {
        console.error("Error al cargar apartados", error);
      }
    };
    fetchApartados();
  }, []);

  // 📡 CARGAR CATÁLOGO DE PRODUCTOS
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/all-pos`);
        if (res.ok) {
          const data = await res.json();
          let listaProductos = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
          setProductosStock(listaProductos);
        }
      } catch (error) {
        console.error("Error al cargar stock", error);
        setProductosStock([]);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setActiveDropdownIndex(null);
      }
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const consultarTSE = async (cedulaABuscar) => {
    const cleanCedula = cedulaABuscar.replace(/\D/g, '');
    if (cleanCedula.length < 9) return;
    setBuscandoCedula(true);
    try {
      const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanCedula}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.nombre) {
          setForm(prev => ({ ...prev, cliente: data.nombre }));
          toast.success("Cliente encontrado en el registro");
        }
      }
    } catch (error) {
      console.log("No se pudo conectar al TSE o cliente no encontrado.");
    } finally {
      setBuscandoCedula(false);
    }
  };

  const handleCedulaChange = (e) => {
    const cedula = e.target.value;
    setForm(prev => ({ ...prev, cedula }));
    
    const cleanCedula = cedula.replace(/\D/g, '');
    if (cleanCedula.length === 9) {
      consultarTSE(cedula);
    }
  };

  const calcularTotalPedido = () => {
    return form.productos.reduce((sum, prod) => sum + (Number(prod.precioItem) * Number(prod.cantidad || 1)), 0);
  };

  const totalCalculado = calcularTotalPedido();
  const faltanteCalculado = totalCalculado - Number(form.abono);

  const agregarOtraChema = () => {
    setForm({
      ...form,
      productos: [...form.productos, { 
        id: Date.now(), tipoPedido: 'stock', busqueda: '', productoObj: null, 
        descripcionManual: '', nombreCamiseta: '', numeroCamiseta: '', version: 'Player', 
        parches: '', talla: 'L', cantidad: 1, precioItem: '', type: '', 
        imagen1: null, imagen2: null, previewImg1: null, previewImg2: null 
      }]
    });
  };

  const eliminarChema = (index) => {
    const nuevos = form.productos.filter((_, i) => i !== index);
    setForm({ ...form, productos: nuevos });
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevos = [...form.productos];
    nuevos[index][campo] = valor;

    if (campo === 'busqueda' && nuevos[index].productoObj) {
      nuevos[index].productoObj = null;
      nuevos[index].type = '';
    }

    setForm({ ...form, productos: nuevos });
  };

  const seleccionarProductoDelStock = (index, itemCat) => {
    const nuevos = [...form.productos];
    const precioFinal = itemCat.discountPrice ? itemCat.discountPrice : (itemCat.price || 15000);
    
    let tallasDisponibles = itemCat.stock ? Object.keys(itemCat.stock).filter(k => Number(itemCat.stock[k]) > 0) : [];
    let tallaAUsar = tallasDisponibles.length > 0 ? tallasDisponibles[0] : (nuevos[index].talla || 'L');

    nuevos[index].productoObj = itemCat;
    nuevos[index].busqueda = itemCat.name;
    nuevos[index].precioItem = precioFinal * (Number(nuevos[index].cantidad) || 1);
    nuevos[index].talla = tallaAUsar;
    nuevos[index].type = itemCat.type || 'Camiseta';
    
    setForm({ ...form, productos: nuevos });
    setActiveDropdownIndex(null);
  };

  // 📸 MANEJAR SUBIDA DE FOTOS POR PRODUCTO ESPECÍFICO
  const handleImageChange = (e, index, imgNumber) => {
    const file = e.target.files[0];
    if (file) {
      const nuevos = [...form.productos];
      nuevos[index][`imagen${imgNumber}`] = file;
      nuevos[index][`previewImg${imgNumber}`] = URL.createObjectURL(file);
      setForm({ ...form, productos: nuevos });
    }
  };

  // 🚀 CREAR APARTADO EN EL BACKEND
  const handleCrearApartado = async (e) => {
    e.preventDefault();
    if (!form.vendedor) return toast.warning("Debes asignar un vendedor a la venta");
    if (Number(form.abono) > totalCalculado) return toast.warning("El abono no puede ser mayor al precio total");

    try {
      // Procesar imágenes de TODOS los productos a Base64
      const productosProcesados = await Promise.all(form.productos.map(async (prod) => {
        let b64_1 = null;
        let b64_2 = null;

        if (prod.tipoPedido === 'nuevo') {
          if (prod.imagen1) b64_1 = await getBase64(prod.imagen1);
          if (prod.imagen2) b64_2 = await getBase64(prod.imagen2);
        } else {
          b64_1 = prod.productoObj?.images?.[0]?.url || prod.productoObj?.imageSrc || null;
        }

        return {
          ...prod,
          imagen1: b64_1,
          imagen2: b64_2,
          previewImg1: null, // Limpiamos preview antes de mandar al backend
          previewImg2: null
        };
      }));

      // Extraemos la foto del primer producto para mostrarla en la portada de la tarjeta (retrocompatibilidad)
      const portada1 = productosProcesados[0]?.imagen1 || null;
      const portada2 = productosProcesados[0]?.imagen2 || null;

      const payload = {
        vendedor: form.vendedor,
        cliente: form.cliente,
        cedula: form.cedula,
        telefono: form.telefono,
        productos: productosProcesados,
        precioTotal: totalCalculado,
        abono: Number(form.abono),
        faltante: faltanteCalculado,
        imagen: portada1,
        imagen2: portada2 
      };

      const res = await fetch(`${API_BASE}/api/apartados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setApartados([...apartados, data.apartado]);
        setShowAddModal(false);
        toast.success(`Apartado creado a nombre de ${form.vendedor}. Abono de ₡${Number(form.abono).toLocaleString()} registrado.`);
        
        setForm({ 
          vendedor: currentUser, cliente: '', cedula: '', telefono: '', abono: '',
          productos: [{ 
            id: Date.now(), tipoPedido: 'stock', busqueda: '', productoObj: null, 
            descripcionManual: '', nombreCamiseta: '', numeroCamiseta: '', version: 'Player', 
            parches: '', talla: 'L', cantidad: 1, precioItem: '', type: '',
            imagen1: null, imagen2: null, previewImg1: null, previewImg2: null 
          }] 
        });
      } else {
        toast.error("Error al guardar en el servidor.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    }
  };

  // 🔄 MOVER ESTADO DEL APARTADO
  const moverApartado = async (id, nuevoEstado) => {
    setApartados(prev => prev.map(ap => (ap._id === id || ap.id === id) ? { ...ap, estado: nuevoEstado } : ap));
    try {
      await fetch(`${API_BASE}/api/apartados/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
    } catch (error) {
      console.error("Error cambiando estado", error);
    }
  };
  
  // 🗑️ CONFIRMAR BORRADO (ABRE MODAL)
  const confirmarBorrado = (id) => {
    setApartadoToDelete(id);
    setShowDeleteModal(true);
  };

  // 🗑️ EJECUTAR BORRADO DEFINITIVO
  const ejecutarBorrado = async () => {
    if (!apartadoToDelete) return;
    const id = apartadoToDelete;
    
    setApartados(prev => prev.filter(ap => (ap._id !== id && ap.id !== id)));
    setShowDeleteModal(false);
    setApartadoToDelete(null);

    try {
      const res = await fetch(`${API_BASE}/api/apartados/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.info("Apartado eliminado exitosamente.");
      } else {
        throw new Error("Error en servidor");
      }
    } catch (error) {
      console.error("Error eliminando", error);
      toast.error("Hubo un problema al eliminar.");
    }
  };

  const confirmarEntrega = (apartado) => { setApartadoSeleccionado(apartado); setShowDeliverModal(true); };
  
  // 💸 ENTREGAR Y REGISTRAR VENTAS
  const ejecutarEntrega = async () => {
    const id = apartadoSeleccionado._id || apartadoSeleccionado.id;
    try {
      const res = await fetch(`${API_BASE}/api/apartados/${id}/entregar`, {
        method: 'POST'
      });

      if (res.ok) {
        setApartados(prev => prev.filter(item => (item._id !== id && item.id !== id)));
        setShowDeliverModal(false);
        setApartadoSeleccionado(null);
        toast.success(`¡Entregado exitosamente! Ganancia sumada a Chemas.`);
      } else {
        toast.error("Error al procesar la entrega en el servidor.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión al entregar.");
    }
  };

  // 📄 EXPORTAR PDF
  const generarPDFPedidos = async () => {
    if (pendientes.length === 0) {
      return toast.warning("No hay pedidos pendientes para exportar.");
    }
    
    // Primero, filtramos todo el arreglo para ver si de verdad hay "pedidos especiales" pendientes
    const hayPedidosEspeciales = pendientes.some(ap => ap.productos.some(prod => prod.tipoPedido === 'nuevo'));
    if (!hayPedidosEspeciales) {
      return toast.warning("No hay 'Pedidos Especiales' en estado pendiente. (Las de stock no se exportan)");
    }

    setIsExporting(true);
    toast.info("Generando PDF, por favor espera...", { autoClose: 2000 });

    try {
      const productosAplanados = [];
      for (const ap of pendientes) {
        for (const prod of ap.productos) {
          
          // 👈 AQUÍ FILTRAMOS: Si es stock, lo ignoramos completamente
          if (prod.tipoPedido === 'stock') continue; 

          let genero = "Men";
          const versionLower = prod.version?.toLowerCase() || '';
          if (versionLower.includes("mujer")) genero = "Women";
          if (versionLower.includes("niño") || versionLower.includes("kid")) genero = "Kids";

          productosAplanados.push({
            imagen1: prod.imagen1 || ap.imagen, // Fallback por si es un apartado viejo
            imagen2: prod.imagen2 || ap.imagen2,
            nombre: prod.descripcionManual,
            genero: genero,
            version: prod.version || 'Fan',
            talla: prod.talla,
            dorsalNombre: prod.nombreCamiseta || '',
            dorsalNumero: prod.numeroCamiseta ? `#${prod.numeroCamiseta}` : '',
            parches: prod.parches || '',
            unidades: prod.cantidad
          });
        }
      }

      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(118, 222, 237);
      doc.rect(14, 14, pageWidth - 28, 10, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.rect(14, 14, pageWidth - 28, 10, 'S'); 
      
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PEDIDOS", pageWidth / 2, 21, { align: "center" });

      const rows = productosAplanados.map(p => [
        '', // Columna vacía para la celda de la imagen
        p.nombre,
        p.genero,
        p.version,
        p.talla,
        p.dorsalNombre,
        p.dorsalNumero,
        p.parches,
        p.unidades
      ]);

      autoTable(doc, {
        startY: 24,
        head: [['Fotos', 'Nombre Producto', 'Genero', 'Versión', 'Talla', 'Dorsal Nombre', 'Dorsal Numero', 'Parche', 'Unidades']],
        body: rows,
        theme: 'grid',
        headStyles: { 
          fillColor: [100, 149, 237], textColor: 0, halign: 'center', valign: 'middle', 
          fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 
        },
        bodyStyles: { 
          textColor: 0, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2 
        },
        columnStyles: { 0: { cellWidth: 50, minCellHeight: 35 }, 1: { cellWidth: 40 } }, // Columna 0 más ancha para 2 fotos
        alternateRowStyles: { fillColor: [173, 216, 230] }, 
        styles: { fillColor: [224, 255, 255] }, 
        
        didDrawCell: function (data) {
          if (data.column.index === 0 && data.cell.section === 'body') {
            const rowIndex = data.row.index;
            const { imagen1, imagen2 } = productosAplanados[rowIndex];
            const padding = 2;
            const x = data.cell.x;
            const y = data.cell.y;

            if (imagen1 && imagen2) {
              // Dibujar 2 fotos dividiendo el ancho a la mitad
              const w = (data.cell.width - padding * 3) / 2;
              const h = data.cell.height - (padding * 2);
              try {
                const format1 = imagen1.includes('png') ? 'PNG' : 'JPEG';
                doc.addImage(imagen1, format1, x + padding, y + padding, w, h);
                const format2 = imagen2.includes('png') ? 'PNG' : 'JPEG';
                doc.addImage(imagen2, format2, x + (padding * 2) + w, y + padding, w, h);
              } catch(e) { doc.text("Error Img", x + 5, y + 15); }
            } else if (imagen1) {
              // Dibujar 1 foto ocupando el centro
              const w = data.cell.width - (padding * 2);
              const h = data.cell.height - (padding * 2);
              try {
                const format = imagen1.includes('png') ? 'PNG' : 'JPEG';
                doc.addImage(imagen1, format, x + padding, y + padding, w, h);
              } catch(e) { doc.text("Error Img", x + 5, y + 15); }
            } else {
              doc.text("Sin foto", x + 15, y + 15);
            }
          }
        }
      });

      doc.save(`Machote_Pedidos_${new Date().toLocaleDateString('es-CR').replace(/\//g, '-')}.pdf`);
      toast.success("PDF generado exitosamente 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Hubo un problema al generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const apartadosFiltrados = apartados.filter(ap => {
    const termino = filtroBusqueda.toLowerCase();
    return ap.cedula?.toLowerCase().includes(termino) || ap.cliente?.toLowerCase().includes(termino);
  });

  const pendientes = apartadosFiltrados.filter(ap => ap.estado === 'PENDIENTE');
  const enCamino = apartadosFiltrados.filter(ap => ap.estado === 'EN_CAMINO');
  const paraEntregar = apartadosFiltrados.filter(ap => ap.estado === 'PARA_ENTREGAR');

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* BOTÓN VOLVER */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 rounded-xl text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition font-bold text-xs uppercase cursor-pointer w-fit mb-6 shadow-sm"
        >
          <FaArrowLeft /> Volver
        </button>

        {/* ENCABEZADO Y BUSCADOR GENERAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-[#D4AF37] flex items-center gap-3">
              <FaBoxOpen /> Tablero de Apartados
            </h1>
            
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 w-full sm:w-auto shadow-inner">
              <FaSearch className="text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Buscar cédula o cliente..." 
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none w-full sm:w-48 placeholder-gray-600"
              />
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-white hover:bg-gray-600 text-black px-4 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 uppercase tracking-widest text-xs"
            >
              <FaPlus /> Nuevo Apartado
            </button>
          </div>
        </div>

        {/* TABLERO KANBAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 min-h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h2 className="font-black uppercase text-gray-300 flex items-center gap-2 text-sm tracking-wider">
                <FaStore className="text-blue-500" /> Hacer Pedido ({pendientes.length})
              </h2>
              <button 
                onClick={generarPDFPedidos}
                disabled={isExporting}
                className={`bg-white hover:bg-gray-300 text-black text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${isExporting ? 'opacity-50' : ''}`}
              >
                <FaFilePdf size={12} /> {isExporting ? 'Generando...' : 'Exportar'}
              </button>
            </div>
            
            <div className="space-y-3">
              {pendientes.length === 0 && <p className="text-xs text-white text-center py-10 font-bold uppercase">Sin pedidos pendientes</p>}
              {pendientes.map(ap => <TarjetaApartado key={ap._id || ap.id} data={ap} accion={() => moverApartado(ap._id || ap.id, 'EN_CAMINO')} btnTexto="Marcar Pedido" btnIcon={<FaArrowRight />} colorBtn="bg-green-600 hover:bg-green-900" onDelete={() => confirmarBorrado(ap._id || ap.id)} />)}
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 min-h-[500px]">
            <div className="mb-4 border-b border-gray-800 pb-2">
              <h2 className="font-black uppercase text-gray-300 flex items-center gap-2 text-sm tracking-wider">
                <FaTruck className="text-amber-500" /> En Proceso / Camino ({enCamino.length})
              </h2>
            </div>
            <div className="space-y-3">
              {enCamino.length === 0 && <p className="text-xs text-gray-600 text-center py-10 font-bold uppercase">Nada en camino por ahora</p>}
              {enCamino.map(ap => <TarjetaApartado key={ap._id || ap.id} data={ap} accion={() => moverApartado(ap._id || ap.id, 'PARA_ENTREGAR')} btnTexto="Ya me llegó" btnIcon={<FaArrowRight />} colorBtn="bg-green-600 hover:bg-green-900 text-white" onDelete={() => confirmarBorrado(ap._id || ap.id)} />)}
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 min-h-[500px]">
            <div className="mb-4 border-b border-gray-800 pb-2">
              <h2 className="font-black uppercase text-gray-300 flex items-center gap-2 text-sm tracking-wider">
                <FaCheck className="text-green-500" /> Para Entregar ({paraEntregar.length})
              </h2>
            </div>
            <div className="space-y-3">
              {paraEntregar.length === 0 && <p className="text-xs text-gray-600 text-center py-10 font-bold uppercase">No hay entregas pendientes</p>}
              {paraEntregar.map(ap => <TarjetaApartado key={ap._id || ap.id} data={ap} accion={() => confirmarEntrega(ap)} btnTexto="Entregar y Cobrar" colorBtn="bg-green-600 hover:bg-green-900" onDelete={() => confirmarBorrado(ap._id || ap.id)} />)}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 MODAL: NUEVO APARTADO */}
      {showAddModal && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 overflow-y-auto">
          
          <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
              <div>
                <h3 className="font-black uppercase text-sm tracking-tight text-black">Registrar Nuevo Apartado</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-black hover:text-white flex items-center justify-center transition cursor-pointer">
                <FaTimes size={12} />
              </button>
            </div>

            <form onSubmit={handleCrearApartado}>
              
              <div className="p-4 sm:p-6 space-y-5 bg-white">
                
                <div className="relative z-50" ref={employeeDropdownRef}>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Asignar venta a empleado *</label>
                  <div 
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-bold bg-white cursor-pointer flex justify-between items-center relative"
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaUserTie className="text-gray-400" size={14}/>
                      {form.vendedor || "Seleccionar..."}
                    </div>
                    <FaChevronDown className="text-gray-400" size={10} />
                  </div>
                  
                  {showEmployeeDropdown && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-y-auto max-h-48 z-[200]">
                      {listaEmpleados.map(emp => (
                        <div 
                          key={emp}
                          onClick={() => { setForm({...form, vendedor: emp}); setShowEmployeeDropdown(false); }}
                          className={`p-3 text-xs font-bold cursor-pointer flex items-center justify-between transition ${form.vendedor === emp ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                        >
                          {emp}
                          {form.vendedor === emp && <FaCheck className="text-green-500" size={10} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 relative z-0">
                  <h4 className="text-[11px] font-black uppercase text-gray-700 mb-3 border-b pb-2">Datos del Cliente</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between items-center">
                        Cédula *
                        {buscandoCedula && <span className="text-blue-500 flex items-center gap-1"><FaSpinner className="animate-spin" size={10}/> TSE</span>}
                      </label>
                      <div className="relative">
                        <FaIdCard className="absolute left-3 top-3 text-gray-400" size={12}/>
                        <input 
                          type="text" required placeholder="101110111" 
                          value={form.cedula} onChange={handleCedulaChange} 
                          className="w-full border p-2 pl-8 rounded-xl text-xs font-bold outline-none focus:border-green-500 bg-white" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Teléfono *</label>
                      <input type="tel" required placeholder="88888888" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full border p-2 rounded-xl text-xs font-bold outline-none focus:border-green-500 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre Completo *</label>
                    <div className="relative">
                      <FaUserTie className="absolute left-3 top-3 text-gray-400" size={12}/>
                      <input type="text" required placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} className="w-full border p-2 pl-8 rounded-xl text-xs font-bold outline-none focus:border-green-500 bg-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[11px] font-black uppercase text-gray-700">Chemas del Pedido ({form.productos.length})</h4>
                    <button type="button" onClick={agregarOtraChema} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1">
                      <FaPlus /> Agregar Otra
                    </button>
                  </div>

                  <div className="space-y-4" ref={searchRef}>
                    {form.productos.map((prod, index) => {
                      const queryText = (prod.busqueda || "").trim().toLowerCase();
                      const sugerencias = queryText.length === 0
                        ? productosStock 
                        : productosStock.filter(cat => {
                            const nombreMatch = cat.name && cat.name.toLowerCase().includes(queryText);
                            const tipoMatch = cat.type && cat.type.toLowerCase().includes(queryText);
                            return nombreMatch || tipoMatch;
                          });
                      
                      const productoVinculado = prod.productoObj;
                      const tallasDisponibles = productoVinculado && productoVinculado.stock 
                        ? Object.keys(productoVinculado.stock).filter(talla => Number(productoVinculado.stock[talla]) > 0)
                        : ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '16', '18', '20', '22', '24', '26', '28', '3', '4', '5'];

                      return (
                        <div key={prod.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/85 shadow-sm relative">
                          
                          {form.productos.length > 1 && (
                            <button type="button" onClick={() => eliminarChema(index)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-200 transition shadow cursor-pointer z-10">
                              <FaTimes size={10} />
                            </button>
                          )}

                          <div className="flex items-center gap-6 mb-4 border-b pb-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                              <input type="radio" checked={prod.tipoPedido === 'stock'} onChange={() => actualizarProducto(index, 'tipoPedido', 'stock')} className="accent-black w-3.5 h-3.5" />
                              Stock
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                              <input type="radio" checked={prod.tipoPedido === 'nuevo'} onChange={() => { actualizarProducto(index, 'tipoPedido', 'nuevo'); actualizarProducto(index, 'productoObj', null); }} className="accent-gray-700 w-3.5 h-3.5" />
                              Pedido Especial
                            </label>
                          </div>

                          {prod.tipoPedido === 'stock' && prod.productoObj && (
                            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-green-300 text-xs mb-3">
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded">
                                  {prod.type || 'Camiseta'}
                                </span>
                                <span className="font-bold text-gray-800 truncate">{prod.busqueda}</span>
                              </div>
                            </div>
                          )}

                          {prod.tipoPedido === 'stock' ? (
                            <div className="mb-4 relative">
                              <div className="relative">
                                <input 
                                  type="text" placeholder="Toca para ver todo el catálogo o busca..." value={prod.busqueda}
                                  onChange={(e) => { actualizarProducto(index, 'busqueda', e.target.value); setActiveDropdownIndex(index); }}
                                  onFocus={() => setActiveDropdownIndex(index)}
                                  className={`w-full border p-2.5 rounded-xl text-xs font-bold outline-none pr-7 ${
                                    prod.productoObj ? 'bg-green-50/30 border-green-400 text-green-900' : 'bg-white border-gray-300 focus:border-black'
                                  }`}
                                />
                                <FaSearch className="absolute right-3 top-3 text-gray-400" size={12} />
                              </div>

                              {!prod.productoObj && activeDropdownIndex === index && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-gray-100">
                                  {sugerencias.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-gray-400 italic font-medium">
                                      No se encontraron resultados en stock.
                                    </div>
                                  ) : (
                                    sugerencias.map(cat => {
                                      const totalEnBodega = cat.stock ? Object.values(cat.stock).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
                                      const precioCat = cat.discountPrice ? cat.discountPrice : (cat.price || 15000);
                                      const imgCat = cat.imageSrc || (cat.images?.[0]?.url || '');
                                      const tipoCat = cat.type || 'Camiseta';

                                      return (
                                        <button
                                          key={cat.id || cat._id}
                                          type="button"
                                          onClick={() => seleccionarProductoDelStock(index, cat)}
                                          className="w-full text-left p-2.5 hover:bg-gray-100 transition flex items-center justify-between group text-xs font-bold cursor-pointer bg-white text-gray-900"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                            {imgCat ? (
                                              <img src={imgCat} alt={cat.name} className="w-8 h-8 object-cover rounded-md border flex-shrink-0" />
                                            ) : (
                                              <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 flex-shrink-0">
                                                <FaTshirt size={12} />
                                              </div>
                                            )}
                                            <div className="truncate">
                                              <div className="flex items-center gap-1">
                                                <span className="text-[8px] uppercase font-black px-1.5 py-0.2 bg-gray-200 text-gray-800 rounded">
                                                  {tipoCat}
                                                </span>
                                              </div>
                                              <span className="block truncate uppercase mt-0.5 text-gray-900 font-bold">{cat.name}</span>
                                              <span className="text-[10px] text-gray-500 font-medium">
                                                Bodega: <strong className={totalEnBodega > 0 ? 'text-green-600' : 'text-red-500'}>{totalEnBodega} unds</strong>
                                              </span>
                                            </div>
                                          </div>
                                          <span className="font-black text-green-700 whitespace-nowrap text-xs flex-shrink-0">
                                            ₡{precioCat.toLocaleString()}
                                          </span>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mb-4 space-y-3">
                              <textarea 
                                required rows="2" placeholder="Describe la chema (Ej: Barcelona 2009 Visitante...)" 
                                value={prod.descripcionManual} onChange={e => actualizarProducto(index, 'descripcionManual', e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-black resize-none bg-white"
                              ></textarea>
                              
                              <div className="grid grid-cols-2 gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                                <div>
                                  <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Nombre Dorsal</label>
                                  <input type="text" placeholder="Ej: MESSI" value={prod.nombreCamiseta} onChange={e => actualizarProducto(index, 'nombreCamiseta', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold outline-none uppercase bg-white focus:border-black" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Número Dorsal</label>
                                  <input type="text" placeholder="Ej: 10 o N/A" value={prod.numeroCamiseta} onChange={e => actualizarProducto(index, 'numeroCamiseta', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold outline-none bg-white focus:border-black" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 block">Versión</label>
                                  <select 
                                    value={prod.version} onChange={e => actualizarProducto(index, 'version', e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-xl text-xs font-bold outline-none focus:border-black bg-white"
                                  >
                                    <option value="Player">Player (Ajustada)</option>
                                    <option value="Fan">Fan (Normal)</option>
                                    <option value="Retro">Retro</option>
                                    <option value="Mujer">Mujer</option>
                                    <option value="Niño">Niño</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="text-[9px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><FaTags size={10}/> Parches (Opcional)</label>
                                  <input 
                                    type="text" placeholder="Ej: Champions..." 
                                    value={prod.parches} onChange={e => actualizarProducto(index, 'parches', e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-xl text-xs font-bold outline-none focus:border-black" 
                                  />
                                </div>
                              </div>

                              {/* 👈 SISTEMA DE DOBLE FOTO PARA ESTE PRODUCTO */}
                              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 mt-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><FaImage /> Referencias Visuales</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="border border-gray-200 rounded-lg p-2 bg-white text-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Foto Principal</span>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, index, 1)} className="text-[9px] w-full cursor-pointer file:rounded file:border-0 file:bg-gray-200 text-gray-500" />
                                    {prod.previewImg1 && <img src={prod.previewImg1} alt="Referencia 1" className="mt-2 w-full h-12 object-cover rounded border" />}
                                  </div>
                                  <div className="border border-gray-200 rounded-lg p-2 bg-white text-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Foto Secundaria</span>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, index, 2)} className="text-[9px] w-full cursor-pointer file:rounded file:border-0 file:bg-gray-200 text-gray-500" />
                                    {prod.previewImg2 && <img src={prod.previewImg2} alt="Referencia 2" className="mt-2 w-full h-12 object-cover rounded border" />}
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}

                          <div className="grid grid-cols-12 gap-1.5 items-center mt-2">
                            <div className="col-span-4">
                              <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Talla</label>
                              {prod.tipoPedido === 'stock' ? (
                                <select 
                                  value={prod.talla} onChange={e => actualizarProducto(index, 'talla', e.target.value)}
                                  className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold outline-none focus:border-black bg-white h-8"
                                >
                                  {tallasDisponibles.length === 0 ? (
                                    <option value="">Agotado</option>
                                  ) : (
                                    tallasDisponibles.map(t => <option key={t} value={t}>{t}</option>)
                                  )}
                                </select>
                              ) : (
                                <input 
                                  type="text" value={prod.talla} onChange={e => actualizarProducto(index, 'talla', e.target.value.toUpperCase())}
                                  placeholder="Ej: L" className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-bold outline-none focus:border-black bg-white h-8 text-center"
                                />
                              )}
                            </div>
                            <div className="col-span-3">
                              <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1 text-center">Cant.</label>
                              <input 
                                type="number" min="1" required value={prod.cantidad} 
                                onChange={e => {
                                  const val = e.target.value;
                                  actualizarProducto(index, 'cantidad', val);
                                  if (prod.tipoPedido === 'stock' && prod.productoObj) {
                                    const pr = prod.productoObj.discountPrice ? prod.productoObj.discountPrice : (prod.productoObj.price || 15000);
                                    actualizarProducto(index, 'precioItem', pr * (Number(val) || 1));
                                  }
                                }}
                                className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-black text-center outline-none focus:border-black bg-amber-50 h-8" 
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Precio (₡)</label>
                              <input 
                                type="number" required placeholder="15000" value={prod.precioItem} onChange={e => actualizarProducto(index, 'precioItem', e.target.value)}
                                className="w-full border border-gray-300 p-1.5 rounded-lg text-xs font-black outline-none focus:border-black bg-white h-8" 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase text-green-800 tracking-wider">Total Pedido:</p>
                      <p className="text-[9px] font-bold text-green-600">{form.productos.reduce((sum, p) => sum + Number(p.cantidad), 0)} chemas en total</p>
                    </div>
                    <p className="text-xl font-black text-green-700">₡{totalCalculado.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-green-200 pt-3">
                    <div>
                      <label className="text-[10px] font-bold text-green-800 uppercase mb-1 block">Abono Inicial (₡) *</label>
                      <input type="number" required placeholder="Ej: 15000" value={form.abono} onChange={e => setForm({...form, abono: e.target.value})} className="w-full border border-green-300 p-2 rounded-xl text-sm font-black text-green-700 bg-white outline-none focus:border-green-600" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Saldo Faltante</p>
                      <p className="text-lg font-black text-red-600">₡{faltanteCalculado > 0 ? faltanteCalculado.toLocaleString() : 0}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* PIE DEL MODAL */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 rounded-b-[2rem] shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="w-1/3 py-3 border rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-200 transition cursor-pointer bg-white shadow-sm"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-2/3 py-3 bg-black hover:bg-gray-600 text-white rounded-xl font-black text-xs shadow-md transition uppercase tracking-widest cursor-pointer">
                  Registrar 
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 💸 MODAL: CONFIRMACIÓN DE ENTREGA */}
      {showDeliverModal && apartadoSeleccionado && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col p-6 relative animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaCheck size={24} />
            </div>

            <h3 className="font-black uppercase text-lg tracking-tight mb-2">Entregar Pedido</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Cliente</p>
              <p className="font-black text-sm mb-3">{apartadoSeleccionado.cliente}</p>
              
              <div className="border-t border-dashed pt-3 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-red-500">Cobrar Faltante:</span>
                <span className="text-xl font-black text-red-600">₡{apartadoSeleccionado.faltante.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 mb-4 font-bold flex items-center justify-center gap-1">
              <FaUserTie /> Vendido por: {apartadoSeleccionado.vendedor}
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowDeliverModal(false)} className="w-1/2 py-3 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition cursor-pointer">Cancelar</button>
              <button onClick={ejecutarEntrega} className="w-1/2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[11px] shadow-md transition uppercase tracking-wider cursor-pointer">Confirmar Cobro</button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col p-6 relative animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaTrash size={24} />
            </div>

            <h3 className="font-black uppercase text-lg tracking-tight mb-2">Eliminar Apartado</h3>
            <p className="text-xs text-gray-500 font-medium mb-6 px-2">
              Esta acción borrará el pedido por completo y devolverá los artículos al stock. No se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setApartadoToDelete(null); }} className="w-1/2 py-3 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition cursor-pointer">Cancelar</button>
              <button onClick={ejecutarBorrado} className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[11px] shadow-md transition uppercase tracking-wider cursor-pointer">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🃏 TARJETA INDIVIDUAL
function TarjetaApartado({ data, accion, btnTexto, btnIcon, colorBtn, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 👈 MOSTRAR FOTO 1 (De la raíz, para apartados viejos o como portada principal)
  let imgSrc1 = null;
  if (data.imagen && typeof data.imagen !== 'string') {
    imgSrc1 = URL.createObjectURL(data.imagen);
  } else if (data.imagen) {
    imgSrc1 = data.imagen; 
  }

  // 👈 MOSTRAR FOTO 2
  let imgSrc2 = null;
  if (data.imagen2 && typeof data.imagen2 !== 'string') {
    imgSrc2 = URL.createObjectURL(data.imagen2);
  } else if (data.imagen2) {
    imgSrc2 = data.imagen2; 
  }

  const primerProducto = data.productos[0];
  const nombrePrincipal = primerProducto.tipoPedido === 'stock' ? primerProducto.busqueda : primerProducto.descripcionManual;
  const masChemas = data.productos.length > 1 ? ` +${data.productos.length - 1}` : '';

  return (
    <div className="bg-black border border-gray-700 p-4 rounded-xl shadow-lg hover:border-gray-500 transition relative overflow-hidden group">
      
      <button 
        onClick={onDelete}
        className="absolute top-3 right-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition cursor-pointer"
        title="Borrar apartado"
      >
        <FaTrash size={12} />
      </button>

      <div className="flex items-center justify-between gap-1 text-[#D4AF37] mb-3 border-b border-gray-800 pb-2 pr-8">
        <div className="flex items-center gap-1">
          <FaUserTie size={10} />
          <span className="text-[9px] font-black uppercase tracking-wider">Vendió: {data.vendedor.split(' ')[0]}</span>
        </div>
        <span className="text-[9px] text-gray-500 font-mono">{new Date(data.fecha || data.fechaCreacion).toLocaleDateString('es-CR')}</span>
      </div>

      <div className="flex gap-2 items-center mb-3">
        {/* 👈 CUBITO CON LAS FOTOS */}
        <div className="flex gap-1 shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden flex items-center justify-center">
            {imgSrc1 ? <img src={imgSrc1} alt="Ref 1" className="w-full h-full object-cover" /> : <FaImage className="text-gray-700" size={16} />}
          </div>
          {imgSrc2 && (
            <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden flex items-center justify-center">
              <img src={imgSrc2} alt="Ref 2" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-2 pl-1">
          <p className="text-xs font-bold text-white truncate leading-tight">
            {nombrePrincipal} <span className="text-gray-400">{masChemas}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1 truncate">Cliente: <span className="text-gray-200">{data.cliente}</span></p>
        </div>
      </div>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-1 py-1 text-[9px] font-black uppercase text-gray-500 hover:text-white transition bg-gray-900/50 rounded-lg mb-3"
      >
        {isExpanded ? <>Ver Menos <FaChevronUp size={8}/></> : <>Ver Más Detalles <FaChevronDown size={8}/></>}
      </button>

      {isExpanded && (
        <div className="mb-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {data.productos.map((prod, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded p-2">
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${prod.tipoPedido === 'stock' ? 'bg-blue-900/50 text-blue-400' : 'bg-purple-900/50 text-purple-400'}`}>
                  {prod.tipoPedido === 'stock' ? 'Stock' : 'Pedido'}
                </span>
                <span className="text-[9px] font-bold text-gray-400">Talla: <span className="text-white">{prod.talla}</span> x{prod.cantidad}</span>
              </div>
              
              <p className="font-bold text-gray-300 text-[10px] leading-tight">
                {prod.tipoPedido === 'stock' ? prod.busqueda : prod.descripcionManual}
              </p>

              {prod.tipoPedido === 'nuevo' && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[8px] bg-gray-800 text-gray-300 px-1 py-0.5 rounded uppercase font-bold border border-gray-700">
                    Ver: {prod.version}
                  </span>
                  {prod.parches && (
                    <span className="text-[8px] bg-indigo-900/40 text-indigo-300 px-1 py-0.5 rounded uppercase font-bold border border-indigo-800/50 flex items-center gap-1">
                      <FaTags size={7}/> {prod.parches}
                    </span>
                  )}
                </div>
              )}

              {prod.tipoPedido === 'nuevo' && (prod.nombreCamiseta || prod.numeroCamiseta) && (
                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider mt-1.5 border-t border-gray-800 pt-1">
                  Dorsal: {prod.nombreCamiseta || 'SIN NOMBRE'} {prod.numeroCamiseta ? `- #${prod.numeroCamiseta}` : ''}
                </p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-800">
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-bold">Cédula</p>
              <p className="text-[10px] text-gray-300 font-mono truncate">{data.cedula}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-500 uppercase font-bold">Teléfono</p>
              <p className="text-[10px] text-gray-300 font-mono">{data.telefono}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111] rounded-lg p-2 flex justify-between items-center mt-3 border border-gray-800">
        <div>
          <p className="text-[9px] text-gray-500 uppercase font-bold">Abonado</p>
          <p className="text-xs text-green-500 font-bold">₡{data.abono.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-500 uppercase font-bold">Faltante</p>
          <p className="text-xs text-red-400 font-black">₡{data.faltante.toLocaleString()}</p>
        </div>
      </div>
      
      <button 
        onClick={accion}
        className={`mt-3 w-full py-2.5 rounded-lg text-[11px] font-black uppercase flex items-center justify-center gap-2 transition cursor-pointer ${colorBtn}`}
      >
        {btnTexto} {btnIcon}
      </button>
    </div>
  );
}