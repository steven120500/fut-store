import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaArrowRight, FaCheck, FaBoxOpen, FaTruck, FaStore, 
  FaImage, FaSearch, FaMoneyBillWave, FaUserTie, FaTrash, FaChevronDown, FaChevronUp, FaFilePdf, FaTags, FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import NewApartadoModal from '../components/NewApartadoModal'; 

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
    "LaR Delflow", "Justin Lobo", "Carlos Lobo", "Alonso Lobo", 
    "Dylan Gomez", "Steven Corrales", "Keylor Gómez"
  ];

  const currentUser = user?.firstName || user?.username || 'Steven Corrales';

  const [form, setForm] = useState({
    vendedor: currentUser, 
    cliente: '',
    cedula: '',
    telefono: '',
    abono: '',
    requiereEnvio: false,
    direccionEnvio: '',
    costoEnvio: 0,
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
        imagen1: null,
        imagen2: null,
        previewImg1: null,
        previewImg2: null 
      }
    ]
  });

  const [buscandoCedula, setBuscandoCedula] = useState(false); 

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

  const handleCedulaChange = async (e) => {
    const cedulaInput = e.target.value;
    setForm(prev => ({ ...prev, cedula: cedulaInput }));

    const cleanCedula = cedulaInput.replace(/\D/g, '');
    if (cleanCedula.length === 9) {
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
    }
  };

  const calcularTotalPedido = () => {
    const subtotal = form.productos.reduce((sum, prod) => sum + (Number(prod.precioItem) * Number(prod.cantidad || 1)), 0);
    const envio = form.requiereEnvio ? (Number(form.costoEnvio) || 0) : 0;
    return subtotal + envio;
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

  const handleImageChange = (e, index, imgNumber) => {
    const file = e.target.files[0];
    if (file) {
      const nuevos = [...form.productos];
      nuevos[index][`imagen${imgNumber}`] = file;
      nuevos[index][`previewImg${imgNumber}`] = URL.createObjectURL(file);
      setForm({ ...form, productos: nuevos });
    }
  };

  const handleCrearApartado = async (e) => {
    e.preventDefault();
    if (!form.vendedor) return toast.warning("Debes asignar un vendedor a la venta");
    if (Number(form.abono) > totalCalculado) return toast.warning("El abono no puede ser mayor al precio total");

    try {
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
          previewImg1: null, 
          previewImg2: null
        };
      }));

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
        costoEnvio: form.requiereEnvio ? Number(form.costoEnvio) : 0,
        direccionEnvio: form.requiereEnvio ? form.direccionEnvio : '',
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
          requiereEnvio: false, direccionEnvio: '', costoEnvio: 0,
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

  const confirmarBorrado = (id) => {
    setApartadoToDelete(id);
    setShowDeleteModal(true);
  };

  const ejecutarBorrado = async () => {
    if (!apartadoToDelete) return;
    const id = apartadoToDelete;
    setApartados(prev => prev.filter(ap => (ap._id !== id && ap.id !== id)));
    setShowDeleteModal(false);
    setApartadoToDelete(null);

    try {
      const res = await fetch(`${API_BASE}/api/apartados/${id}`, { method: 'DELETE' });
      if (res.ok) toast.info("Apartado eliminado exitosamente.");
      else throw new Error("Error en servidor");
    } catch (error) {
      console.error("Error eliminando", error);
      toast.error("Hubo un problema al eliminar.");
    }
  };

  const confirmarEntrega = (apartado) => { setApartadoSeleccionado(apartado); setShowDeliverModal(true); };

  const ejecutarEntrega = async () => {
    const id = apartadoSeleccionado._id || apartadoSeleccionado.id;
    try {
      const res = await fetch(`${API_BASE}/api/apartados/${id}/entregar`, { method: 'POST' });
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

  // 🧮 LÓGICA DE CONTEO INTELIGENTE (TACOS VS CHEMAS)
  const contarArticulos = (apartadosArr) => {
    let chemas = 0;
    let tacos = 0;
    
    apartadosArr.forEach(ap => {
      (ap.productos || []).forEach(p => {
        const tipo = (p.type || '').toLowerCase();
        const nombre = (p.nombre || p.busqueda || p.descripcionManual || '').toLowerCase();
        const version = (p.version || '').toLowerCase();
        const talla = (p.talla || '').toLowerCase();
        
        const cant = Number(p.cantidad) || 1;

        // Condición para detectar tacos en productos nuevos o viejos
        if (tipo.includes('tacos') || nombre.includes('tacos') || version.includes('tacos') || talla.includes('us')) {
          tacos += cant;
        } else {
          chemas += cant;
        }
      });
    });
    
    return { chemas, tacos };
  };

  // 📄 EXPORTAR PDF CON DISEÑO FUTSTORE Y TOTALES DESGLOSADOS
  const generarPDFPedidos = async () => {
    if (pendientes.length === 0) {
      return toast.warning("No hay pedidos pendientes para exportar.");
    }

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

          if (prod.tipoPedido === 'stock') continue; 

          let genero = "Men";
          const versionLower = prod.version?.toLowerCase() || '';
          const tallaLower = prod.talla?.toLowerCase() || '';
          const tipoLower = (prod.type || '').toLowerCase();
          
          const isTaco = versionLower.includes('tacos') || tallaLower.includes('us') || tipoLower.includes('tacos');

          if (isTaco) genero = "Calzado";
          else if (versionLower.includes("mujer")) genero = "Women";
          else if (versionLower.includes("niño") || versionLower.includes("kid")) genero = "Kids";

          productosAplanados.push({
            imagen1: prod.imagen1 || ap.imagen, 
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

      // ⬛ ENCABEZADO NEGRO ESTILO FUTSTORE
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageWidth, 42, 'F');

      // 🟡 LÍNEA DORADA DE ACENTO
      doc.setFillColor(212, 175, 55); 
      doc.rect(0, 42, pageWidth, 3, 'F');

      // TÍTULOS
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("FUTSTORE CR - PEDIDOS ESPECIALES (PROVEEDOR)", 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CR')}`, 14, 30);

      const rows = productosAplanados.map(p => [
        { content: '', imagen1: p.imagen1, imagen2: p.imagen2 }, 
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
        startY: 55,
        head: [['Fotos', 'Nombre Producto', 'Categoria', 'Versión', 'Talla', 'Dorsal Nombre', 'Dorsal Numero', 'Parche', 'Unidades']],
        body: rows,
        theme: 'grid',
        headStyles: { 
          fillColor: [17, 17, 17], textColor: [212, 175, 55], halign: 'center', valign: 'middle', 
          fontStyle: 'bold', fontSize: 9
        },
        bodyStyles: { 
          textColor: [30, 30, 30], halign: 'center', valign: 'middle', fontSize: 8
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 50, minCellHeight: 35 }, 1: { cellWidth: 40 } }, 

        didDrawCell: function (data) {
          if (data.column.index === 0 && data.cell.section === 'body') {
            const rawCell = data.cell.raw || {};
            const imagen1 = rawCell.imagen1;
            const imagen2 = rawCell.imagen2;
            const padding = 2;
            const x = data.cell.x;
            const y = data.cell.y;

            if (imagen1 && imagen2) {
              const w = (data.cell.width - padding * 3) / 2;
              const h = data.cell.height - (padding * 2);
              try {
                const format1 = imagen1.includes('png') ? 'PNG' : 'JPEG';
                doc.addImage(imagen1, format1, x + padding, y + padding, w, h);
                const format2 = imagen2.includes('png') ? 'PNG' : 'JPEG';
                doc.addImage(imagen2, format2, x + (padding * 2) + w, y + padding, w, h);
              } catch(e) { doc.text("Error Img", x + 5, y + 15); }
            } else if (imagen1) {
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

      // 🏆 TOTALES AL FINAL DEL PDF
      const finalY = doc.lastAutoTable.finalY + 15;
      const totalesPedidos = contarArticulos(pendientes);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Resumen a solicitar al proveedor:`, 14, finalY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`👕 Camisetas / Ropa: ${totalesPedidos.chemas} unds`, 14, finalY + 7);
      doc.text(`👟 Zapatos / Tacos: ${totalesPedidos.tacos} prs`, 14, finalY + 14);

      doc.save(`Pedidos_Especiales_${new Date().toLocaleDateString('es-CR').replace(/\//g, '-')}.pdf`);
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

  // Cálculos para el UI visual
  const conteoPendientes = contarArticulos(pendientes);
  const conteoCamino = contarArticulos(enCamino);
  const conteoEntregar = contarArticulos(paraEntregar);

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
              <div>
                <h2 className="font-black uppercase text-gray-300 flex items-center gap-2 text-sm tracking-wider">
                  <FaStore className="text-blue-500" /> Hacer Pedido ({pendientes.length})
                </h2>
                <div className="flex gap-3 mt-1 text-[10px] text-gray-500 font-bold">
                   <span>👕 {conteoPendientes.chemas}</span>
                   <span>👟 {conteoPendientes.tacos}</span>
                </div>
              </div>
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
              <div className="flex gap-3 mt-1 text-[10px] text-gray-500 font-bold">
                 <span>👕 {conteoCamino.chemas}</span>
                 <span>👟 {conteoCamino.tacos}</span>
              </div>
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
              <div className="flex gap-3 mt-1 text-[10px] text-gray-500 font-bold">
                 <span>👕 {conteoEntregar.chemas}</span>
                 <span>👟 {conteoEntregar.tacos}</span>
              </div>
            </div>
            <div className="space-y-3">
              {paraEntregar.length === 0 && <p className="text-xs text-gray-600 text-center py-10 font-bold uppercase">No hay entregas pendientes</p>}
              {paraEntregar.map(ap => <TarjetaApartado key={ap._id || ap.id} data={ap} accion={() => confirmarEntrega(ap)} btnTexto="Entregar y Cobrar" colorBtn="bg-green-600 hover:bg-green-900" onDelete={() => confirmarBorrado(ap._id || ap.id)} />)}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 COMPONENTE DEL MODAL EXTRAÍDO */}
      <NewApartadoModal 
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        form={form}
        setForm={setForm}
        handleCrearApartado={handleCrearApartado}
        employeeDropdownRef={employeeDropdownRef}
        showEmployeeDropdown={showEmployeeDropdown}
        setShowEmployeeDropdown={setShowEmployeeDropdown}
        listaEmpleados={listaEmpleados}
        buscandoCedula={buscandoCedula}
        handleCedulaChange={handleCedulaChange}
        agregarOtraChema={agregarOtraChema}
        searchRef={searchRef}
        productosStock={productosStock}
        eliminarChema={eliminarChema}
        actualizarProducto={actualizarProducto}
        seleccionarProductoDelStock={seleccionarProductoDelStock}
        handleImageChange={handleImageChange}
        totalCalculado={totalCalculado}
        faltanteCalculado={faltanteCalculado}
        activeDropdownIndex={activeDropdownIndex}
        setActiveDropdownIndex={setActiveDropdownIndex}
      />

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

  let imgSrc1 = null;
  if (data.imagen && typeof data.imagen !== 'string') imgSrc1 = URL.createObjectURL(data.imagen);
  else if (data.imagen) imgSrc1 = data.imagen; 

  let imgSrc2 = null;
  if (data.imagen2 && typeof data.imagen2 !== 'string') imgSrc2 = URL.createObjectURL(data.imagen2);
  else if (data.imagen2) imgSrc2 = data.imagen2; 

  const primerProducto = data.productos[0];
  const nombrePrincipal = primerProducto.tipoPedido === 'stock' ? primerProducto.busqueda : primerProducto.descripcionManual;
  const masArticulos = data.productos.length > 1 ? ` +${data.productos.length - 1} más` : '';

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
            {nombrePrincipal} <span className="text-gray-400">{masArticulos}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1 truncate">Cliente: <span className="text-gray-200">{data.cliente}</span></p>
        </div>
      </div>

      {/* ETIQUETA DE ENVÍO Y DIRECCIÓN */}
      {data.costoEnvio > 0 && (
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-2 mb-3">
          <p className="text-[9px] font-black text-blue-400 uppercase flex items-center gap-1 mb-1">
            <FaTruck size={10}/> Requiere Envío (₡{data.costoEnvio})
          </p>
          <p className="text-[10px] text-gray-300 font-medium leading-tight">
            {data.direccionEnvio}
          </p>
        </div>
      )}

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