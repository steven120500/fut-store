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

    // Elementos para filtrado por tipo
    const filtroTipoBtns = document.querySelectorAll('.tipo-btn');
    const btnAplicarFiltro = document.getElementById('aplicar-filtro-tipo');

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

        // Eventos para filtrado por tipo
        if (filtroTipoBtns.length > 0) {
            filtroTipoBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    this.classList.toggle('active');
                    aplicarFiltroTipo();
                });
            });
        }

        if (btnAplicarFiltro) {
            btnAplicarFiltro.addEventListener('click', aplicarFiltroTipo);
        }
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
                <tr data-tipo="${item.tipo || ''}">
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

    // ===================== FUNCIONES DE VENTAS =====================
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

    // ===================== FUNCIONES DE FILTRADO =====================
    function aplicarFiltroTipo() {
        const tiposActivos = Array.from(document.querySelectorAll('.tipo-btn.active'))
            .map(btn => btn.dataset.tipo);
        
        if (tiposActivos.length === 0) {
            // Si no hay filtros seleccionados, mostrar todo
            document.querySelectorAll('#cuerpo-tabla tr').forEach(tr => {
                tr.style.display = '';
            });
            return;
        }

        // Ocultar todos los elementos primero
        document.querySelectorAll('#cuerpo-tabla tr').forEach(tr => {
            tr.style.display = 'none';
        });

        // Mostrar solo los que coinciden con los tipos seleccionados
        tiposActivos.forEach(tipo => {
            document.querySelectorAll(`#cuerpo-tabla tr[data-tipo="${tipo}"]`).forEach(tr => {
                tr.style.display = '';
            });
        });
    }

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
        // Resetear botones de tipo
        document.querySelectorAll('.tipo-btn').forEach(btn => {
            btn.classList.add('active');
        });
        aplicarFiltroTipo();
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

    // ===================== FUNCIONES DEL PANEL DE VENTAS =====================
    function mostrarPanelVentas() {
        if (ventasPanel) ventasPanel.style.display = 'flex';
    }

    function ocultarPanelVentas() {
        if (ventasPanel) ventasPanel.style.display = 'none';
    }

    async function limpiarVentas() {
        if (!confirm('¿Estás seguro de eliminar TODAS las ventas del día?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/sales/clear`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al limpiar ventas');

            ventasDelDia = [];
            totalVentas = 0;
            actualizarPanelVentas();
            mostrarNotificacion('Ventas eliminadas correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al limpiar ventas', 'error');
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

    async function exportarPDF() {
        try {
            if (ventasDelDia.length === 0) {
                throw new Error('No hay ventas para generar PDF');
            }
    
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('Reporte de Ventas - FutStore', 105, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 14, 36);
            
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(58, 83, 155);
            doc.rect(14, 45, 182, 10, 'F');
            doc.text('Producto', 20, 51);
            doc.text('Cant.', 140, 51);
            doc.text('Precio', 160, 51);
            doc.text('Total', 180, 51);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            let y = 60;
            
            ventasDelDia.forEach(venta => {
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
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Total del día: ${totalVentas.toFixed(2)} €`, 180, y + 15, { align: 'right' });
            
            doc.save(`Ventas_FutStore_${new Date().toISOString().split('T')[0]}.pdf`);
    
        } catch (error) {
            console.error('Error al generar PDF:', error);
            mostrarNotificacion(error.message, 'error');
        }
    }
});