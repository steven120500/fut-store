const API_BASE_URL = 'https://fut-store.onrender.com/api';  // Usa HTTPS

document.addEventListener('DOMContentLoaded', function() {
    // Variables de estado
    let inventario = [];
    let ventasDelDia = [];
    let totalVentas = 0;
    let articuloEditandoId = null;
    let inventarioFiltrado = null;

    // Elementos del DOM
    const form = document.getElementById('form-articulo');
    const tabla = document.getElementById('cuerpo-tabla');
    const inputBusqueda = document.getElementById('busqueda');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnReset = document.getElementById('btn-reset');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnFiltrarBajoStock = document.getElementById('btn-filtrar-bajo-stock');
    const btnVentas = document.getElementById('btn-ventas');
    const ventasPanel = document.getElementById('ventas-panel');
    const listaVentas = document.getElementById('lista-ventas');
    const totalVentasElement = document.getElementById('total-ventas');
    const contadorVentas = document.getElementById('contador-ventas');
    const btnCerrarVentas = document.getElementById('cerrar-ventas');
    const btnLimpiarVentas = document.getElementById('btn-limpiar-ventas');
    const errorVentasElement = document.getElementById('error-ventas');
    const tablaVentas = document.getElementById('tabla-ventas');
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');

    // Inicialización
    cargarDatosIniciales();
    setupEventListeners();

    // ===================== FUNCIONES PRINCIPALES =====================
    async function cargarDatosIniciales() {
        try {
            await Promise.all([
                cargarInventario(),
                cargarYMostrarVentasDelDia()
            ]);
            verificarDiaNuevo();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            mostrarNotificacion('Error al cargar datos iniciales', 'error');
        }
    }

    function setupEventListeners() {
        form.addEventListener('submit', manejarSubmit);
        btnFiltrar.addEventListener('click', filtrarArticulos);
        btnReset.addEventListener('click', resetearFiltros);
        btnFiltrarBajoStock.addEventListener('click', filtrarBajoStock);
        btnVentas.addEventListener('click', mostrarPanelVentas);
        btnCerrarVentas?.addEventListener('click', ocultarPanelVentas);
        btnLimpiarVentas?.addEventListener('click', limpiarVentas);
        btnExportarPDF?.addEventListener('click', exportarPDF);
        
        document.getElementById('precio')?.addEventListener('input', validarCampoNumerico);
        document.getElementById('cantidad')?.addEventListener('input', validarCampoNumerico);
    }

    // ===================== FUNCIONES DE INVENTARIO =====================
    async function cargarInventario() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Error al cargar inventario');
            inventario = await response.json();
            renderizarTabla();
        } catch (error) {
            console.error('Error cargando inventario:', error);
            mostrarNotificacion('Error al cargar inventario', 'error');
        }
    }

    function manejarSubmit(e) {
        e.preventDefault();
        const precio = parseFloat(document.getElementById('precio').value);
        if (isNaN(precio)) {
            mostrarNotificacion('El precio debe ser un número válido', 'error');
            return;
        }
        articuloEditandoId ? actualizarArticulo(articuloEditandoId) : agregarArticulo();
    }

    async function agregarArticulo() {
        const datosFormulario = obtenerDatosFormulario();
        if (!validarFormulario(datosFormulario)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosFormulario)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al agregar producto');
            }

            const nuevoProducto = await response.json();
            inventario.unshift(nuevoProducto);
            form.reset();
            renderizarTabla();
            mostrarNotificacion('Artículo agregado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        }
    }

    async function eliminarArticulo(id) {
        if (!confirm('¿Está seguro de eliminar este artículo?')) return;
    
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE'
            });
    
            if (!response.ok) throw new Error('Error al eliminar');
    
            inventario = inventario.filter(item => item._id !== id);
            if (inventarioFiltrado) {
                inventarioFiltrado = inventarioFiltrado.filter(item => item._id !== id);
            }
            
            renderizarTabla();
            mostrarNotificacion('Artículo eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error eliminando:', error);
            mostrarNotificacion('Error al eliminar artículo', 'error');
        }
    }

    async function actualizarArticulo(id) {
        const datosFormulario = obtenerDatosFormulario();
        if (!validarFormulario(datosFormulario)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosFormulario)
            });

            if (!response.ok) throw new Error('Error al actualizar');

            const articuloActualizado = await response.json();
            const indice = inventario.findIndex(item => item._id === id);
            if (indice !== -1) inventario[indice] = articuloActualizado;

            form.reset();
            btnAgregar.textContent = 'Agregar al Inventario';
            articuloEditandoId = null;
            renderizarTabla();
            mostrarNotificacion('Artículo actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando:', error);
            mostrarNotificacion('Error al actualizar artículo', 'error');
        }
    }

    function renderizarTabla(items = inventario) {
        if (!tabla) return;

        tabla.innerHTML = items.length === 0 
            ? '<tr><td colspan="10">No hay artículos en el inventario</td></tr>'
            : items.map(item => `
                <tr>
                    <td>${item.equipo || '-'}</td>
                    <td>${item.jugador || '-'}</td>
                    <td>${item.temporada || '-'}</td>
                    <td>${item.color || '-'}</td>
                    <td>${item.talla || '-'}</td>
                    <td>${item.cantidad || 0} ${item.cantidad <= 1 ? '<span class="warning-icon">⚠️</span>' : ''}</td>
                    <td>${item.precio ? item.precio.toFixed(2) : '0.00'} €</td>
                    <td>${item.tipo || '-'}</td>
                    <td class="acciones-cuadradas">
                        <button class="editar" data-id="${item._id}" title="Editar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="eliminar" data-id="${item._id}" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                    <td class="venta-celda">
                        <button class="btn-vender" data-id="${item._id}" ${item.cantidad <= 0 ? 'disabled' : ''} title="Vender">
                            <i class="fas fa-cash-register"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

        agregarEventosBotones();
    }

    // ===================== FUNCIONES DE VENTAS (CORREGIDAS) =====================
    async function cargarYMostrarVentasDelDia() {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/today`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            ventasDelDia = data.ventas || [];
            totalVentas = data.total || 0;
            
            actualizarPanelVentas();
        } catch (error) {
            console.error("Error al cargar ventas:", error);
            mostrarError("Error al cargar las ventas. Intente nuevamente.");
        }
    }
    async function venderArticulo(id) {
        const articulo = inventario.find(item => item._id === id);
        if (!articulo || articulo.cantidad <= 0) {
            mostrarNotificacion('No hay stock disponible', 'error');
            return;
        }
    
        try {
            // Solo registrar la venta (el endpoint /sales ya actualiza el stock)
            const ventaData = {
                productoId: id,
                equipo: articulo.equipo,
                jugador: articulo.jugador,
                temporada: articulo.temporada,
                color: articulo.color,
                talla: articulo.talla,
                tipo: articulo.tipo,
                precio: articulo.precio,
                cantidad: 1
            };
    
            const ventaResponse = await fetch(`${API_BASE_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ventaData)
            });
    
            if (!ventaResponse.ok) {
                const errorData = await ventaResponse.json();
                throw new Error(errorData.message || 'Error al registrar venta');
            }
    
            const nuevaVenta = await ventaResponse.json();
            ventasDelDia.push(nuevaVenta);
            totalVentas += articulo.precio;
    
            // Actualizar UI
            await cargarInventario();
            actualizarPanelVentas();
            mostrarNotificacion(`Vendido: 1x ${articulo.equipo} - ${articulo.jugador}`, 'success');
            
        } catch (error) {
            console.error('Error en el proceso de venta:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
        }
    }

    function actualizarPanelVentas() {
        if (!listaVentas || !totalVentasElement || !contadorVentas) return;

        const ventasOrdenadas = [...ventasDelDia].sort((a, b) => 
            new Date(b.fecha) - new Date(a.fecha));

        listaVentas.innerHTML = ventasOrdenadas.length === 0
            ? '<div class="sin-ventas">No hay ventas registradas hoy</div>'
            : ventasOrdenadas.map(venta => `
                <div class="venta-item">
                    <span class="hora-venta">${new Date(venta.fecha).toLocaleTimeString()}</span>
                    <span class="detalle-venta">
                        ${venta.cantidad}x ${venta.equipo} - ${venta.jugador} (${venta.talla})
                    </span>
                    <span class="precio-venta">${venta.precio.toFixed(2)} €</span>
                </div>
            `).join('');

        const nuevoTotal = ventasOrdenadas.reduce((total, venta) => 
            total + (venta.precio * venta.cantidad), 0);
        
        totalVentasElement.textContent = `${nuevoTotal.toFixed(2)} €`;
        contadorVentas.textContent = ventasOrdenadas.length;
    }

    // ===================== FUNCIONES AUXILIARES =====================
    function obtenerDatosFormulario() {
        return {
            equipo: document.getElementById('equipo').value.trim(),
            jugador: document.getElementById('jugador').value.trim(),
            temporada: document.getElementById('temporada').value.trim() || '2023-2024',
            color: document.getElementById('color').value.trim(),
            talla: document.getElementById('talla').value,
            tipo: document.getElementById('tipo').value,
            cantidad: parseInt(document.getElementById('cantidad').value) || 0,
            precio: parseFloat(document.getElementById('precio').value) || 0
        };
    }

    function validarFormulario(datos) {
        if (!datos.equipo || !datos.jugador) {
            mostrarNotificacion('Equipo y jugador son campos obligatorios', 'error');
            return false;
        }
        if (isNaN(datos.cantidad) || datos.cantidad < 0) {
            mostrarNotificacion('La cantidad debe ser un número válido', 'error');
            return false;
        }
        if (isNaN(datos.precio) || datos.precio <= 0) {
            mostrarNotificacion('El precio debe ser mayor a 0', 'error');
            return false;
        }
        return true;
    }

    function agregarEventosBotones() {
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', () => prepararEdicion(btn.dataset.id));
        });

        document.querySelectorAll('.eliminar').forEach(btn => {
            btn.addEventListener('click', () => eliminarArticulo(btn.dataset.id));
        });

        document.querySelectorAll('.btn-vender').forEach(btn => {
            btn.addEventListener('click', () => venderArticulo(btn.dataset.id));
        });
    }

    function prepararEdicion(id) {
        const articulo = inventario.find(item => item._id === id);
        if (!articulo) return;

        articuloEditandoId = id;
        document.getElementById('equipo').value = articulo.equipo || '';
        document.getElementById('jugador').value = articulo.jugador || '';
        document.getElementById('temporada').value = articulo.temporada || '';
        document.getElementById('color').value = articulo.color || '';
        document.getElementById('talla').value = articulo.talla || 'M';
        document.getElementById('tipo').value = articulo.tipo || 'Retro';
        document.getElementById('cantidad').value = articulo.cantidad || 1;
        document.getElementById('precio').value = articulo.precio || 0;

        btnAgregar.innerHTML = '<i class="fas fa-save"></i> Actualizar Artículo';
    }

    function mostrarError(mensaje) {
        if (errorVentasElement) {
            errorVentasElement.textContent = mensaje;
            errorVentasElement.style.display = 'block';
            setTimeout(() => errorVentasElement.style.display = 'none', 5000);
        }
        console.error(mensaje);
    }

    function mostrarNotificacion(mensaje, tipo) {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${mensaje}</span>
        `;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add('fade-out');
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }

    function validarCampoNumerico(e) {
        const input = e.target;
        input.classList.toggle('input-error', isNaN(input.value));
    }

    // ===================== FUNCIONES DE FILTRADO =====================
    function filtrarArticulos() {
        const busqueda = inputBusqueda.value.trim().toLowerCase();
        if (!busqueda) return;

        inventarioFiltrado = inventario.filter(item =>
            (item.equipo && item.equipo.toLowerCase().includes(busqueda)) ||
            (item.jugador && item.jugador.toLowerCase().includes(busqueda)) ||
            (item.tipo && item.tipo.toLowerCase().includes(busqueda))
        );

        renderizarTabla(inventarioFiltrado);
    }

    function filtrarBajoStock() {
        inventarioFiltrado = inventario.filter(item => item.cantidad <= 1);
        renderizarTabla(inventarioFiltrado);
    }

    function resetearFiltros() {
        inputBusqueda.value = '';
        inventarioFiltrado = null;
        renderizarTabla();
    }

    // ===================== FUNCIONES DEL PANEL DE VENTAS =====================
    function mostrarPanelVentas() {
        if (ventasPanel) ventasPanel.style.display = 'flex';
    }

    function ocultarPanelVentas() {
        if (ventasPanel) ventasPanel.style.display = 'none';
    }

   
   // ===================== FUNCIÓN LIMPIAR VENTAS (CORREGIDA) =====================
// Función para limpiar ventas - VERSIÓN CORREGIDA
async function limpiarVentas() {
    if (!confirm('¿Estás seguro de eliminar TODAS las ventas del día?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/sales/clear`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al limpiar ventas');
        }

        // Actualizar la interfaz manualmente
        ventasDelDia = [];
        totalVentas = 0;
        document.getElementById('lista-ventas').innerHTML = '<div class="sin-ventas">No hay ventas registradas hoy</div>';
        document.getElementById('total-ventas').textContent = '0.00 €';
        document.getElementById('contador-ventas').textContent = '0';

        // Mostrar notificación
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion success';
        notificacion.innerHTML = '<i class="fas fa-check-circle"></i> Ventas eliminadas correctamente';
        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 3000);

    } catch (error) {
        console.error('Error:', error);
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion error';
        notificacion.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 3000);
    }
}

    async function verificarDiaNuevo() {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/check-new-day`);
            const { esNuevoDia, ventas } = await response.json();

            if (esNuevoDia) {
                ventasDelDia = ventas || [];
                totalVentas = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0) || 0;
                actualizarPanelVentas();
            }
        } catch (error) {
            console.error('Error verificando día nuevo:', error);
        }
    }

    // ===================== FUNCIÓN EXPORTAR PDF (NUEVA) =====================
    async function generarPDF() {
        try {
            // Verificar si hay ventas
            if (ventasDelDia.length === 0) {
                throw new Error('No hay ventas para generar PDF');
            }
    
            // Crear PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Estilo profesional
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('Reporte de Ventas - FutStore', 105, 20, { align: 'center' });
            
            // Información de la tienda
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 14, 36);
            
            // Encabezados de tabla
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(58, 83, 155);
            doc.rect(14, 45, 182, 10, 'F');
            doc.text('Producto', 20, 51);
            doc.text('Cant.', 140, 51);
            doc.text('Precio', 160, 51);
            doc.text('Total', 180, 51);
            
            // Detalle de ventas
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            let y = 60;
            
            ventasDelDia.forEach(venta => {
                // Salto de página si es necesario
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.text(`${venta.equipo} - ${venta.jugador} (${venta.talla})`, 20, y);
                doc.text(venta.cantidad.toString(), 140, y);
                doc.text(`${venta.precio.toFixed(2)} €`, 160, y);
                doc.text(`${(venta.precio * venta.cantidad).toFixed(2)} €`, 180, y);
                
                y += 10;
            });
            
            // Total
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Total del día: ${totalVentas.toFixed(2)} €`, 180, y + 15, { align: 'right' });
            
            // Guardar
            doc.save(`Ventas_FutStore_${new Date().toISOString().split('T')[0]}.pdf`);
    
        } catch (error) {
            console.error('Error al generar PDF:', error);
            const notificacion = document.createElement('div');
            notificacion.className = 'notificacion error';
            notificacion.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
            document.body.appendChild(notificacion);
            setTimeout(() => notificacion.remove(), 3000);
        }
    }
    
    // Asignar eventos - DEBEN ESTAR EN TU CÓDIGO ACTUAL
    document.getElementById('btn-limpiar-ventas').addEventListener('click', limpiarVentas);
    document.getElementById('btn-descargar-pdf').addEventListener('click', generarPDF);
    
    // Función auxiliar para cargar scripts dinámicamente
    function cargarScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Función auxiliar para convertir Blob a Base64 (opcional para logos)
    function blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }
});