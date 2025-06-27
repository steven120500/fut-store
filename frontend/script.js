const API_BASE_URL = 'http://localhost:3000/api';


async function cargarInventario() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        if (!response.ok) throw new Error('Error al cargar inventario');
        const data = await response.json();
        console.log('Productos cargados:', data); // Verifica en consola
        return data;
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar inventario', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Variables de estado
    let inventario = [];
    let articuloEditandoId = null;
    let inventarioFiltrado = null;
    let ventasDelDia = [];
    let totalVentas = 0;

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

    // Inicialización
    cargarDatosIniciales();
    setupEventListeners();

    // Función para cargar datos iniciales
    async function cargarDatosIniciales() {
        try {
            await Promise.all([
                cargarInventario(),
                cargarVentasDelDia()
            ]);
            actualizarPanelVentas();
            verificarDiaNuevo();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            mostrarNotificacion('Error al cargar datos iniciales', 'error');
        }
    }

    // Función para configurar event listeners
    function setupEventListeners() {
        form.addEventListener('submit', manejarSubmit);
        btnFiltrar.addEventListener('click', filtrarArticulos);
        btnReset.addEventListener('click', resetearFiltros);
        btnFiltrarBajoStock.addEventListener('click', filtrarBajoStock);
        btnVentas.addEventListener('click', mostrarPanelVentas);
        btnCerrarVentas.addEventListener('click', ocultarPanelVentas);
        btnLimpiarVentas.addEventListener('click', limpiarVentas);

        // Validación en tiempo real
        document.getElementById('precio').addEventListener('input', validarCampoNumerico);
        document.getElementById('cantidad').addEventListener('input', validarCampoNumerico);

        // Evento para descargar PDF si existe el botón
        if (document.getElementById('btn-descargar-pdf')) {
            document.getElementById('btn-descargar-pdf').addEventListener('click', generarPDF);
        }
    }

    // Función para validar campos numéricos
    function validarCampoNumerico(e) {
        const input = e.target;
        if (isNaN(input.value)) {
            input.classList.add('input-error');
        } else {
            input.classList.remove('input-error');
        }
    }

    // Función principal para manejar el envío del formulario
    function manejarSubmit(e) {
        e.preventDefault();

        const precio = parseFloat(document.getElementById('precio').value);
        if (isNaN(precio)) {
            mostrarNotificacion('El precio debe ser un número válido', 'error');
            return;
        }

        articuloEditandoId ? actualizarArticulo(articuloEditandoId) : agregarArticulo();
    }

    // Función para cargar el inventario desde el backend
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

    // Función para cargar ventas del día desde el backend
    async function cargarVentasDelDia() {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/today`);
            if (!response.ok) throw new Error('Error al cargar ventas');
            const data = await response.json();
            ventasDelDia = data.ventas || [];
            totalVentas = data.total || 0;
        } catch (error) {
            console.error('Error cargando ventas:', error);
        }
    }

    // Función para agregar artículo
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
            inventario.unshift(nuevoProducto); // Añade al principio

            form.reset();
            renderizarTabla();
            mostrarNotificacion('Artículo agregado correctamente', 'success');

            // Scroll a la tabla para ver el nuevo elemento
            document.querySelector('.table-container')?.scrollIntoView({
                behavior: 'smooth'
            });

        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        }
    }

    // Función corregida para eliminar artículo
    async function eliminarArticulo(id) {
        if (!confirm('¿Está seguro de eliminar este artículo?')) return;
    
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar');
            }
    
            // Eliminar del array local
            inventario = inventario.filter(item => item._id !== id);
            
            // Actualizar tabla filtrada si existe
            if (inventarioFiltrado) {
                inventarioFiltrado = inventarioFiltrado.filter(item => item._id !== id);
            }
            
            renderizarTabla();
            mostrarNotificacion('Artículo eliminado correctamente', 'success');
    
        } catch (error) {
            console.error('Error eliminando:', error);
            mostrarNotificacion(error.message || 'Error al eliminar artículo', 'error');
        }
    }

    // Función para actualizar artículo
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
    

    // Función para vender artículo
    async function venderArticulo(id) {
        const articulo = inventario.find(item => item._id === id);
        if (!articulo || articulo.cantidad <= 0) {
            mostrarNotificacion('No hay stock disponible', 'error');
            return;
        }

        try {
            // Actualizar cantidad en el backend
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...articulo,
                    cantidad: articulo.cantidad - 1
                })
            });

            if (!response.ok) throw new Error('Error al registrar venta');

            const articuloActualizado = await response.json();
            inventario = inventario.map(item => item._id === id ? articuloActualizado : item);

            // Registrar venta
            const venta = {
                productoId: id,
                equipo: articulo.equipo,
                jugador: articulo.jugador,
                talla: articulo.talla,
                precio: articulo.precio,
                cantidad: 1
            };

            const ventaResponse = await fetch(`${API_BASE_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(venta)
            });

            if (!ventaResponse.ok) throw new Error('Error al guardar venta');

            const resultadoVenta = await ventaResponse.json();
            ventasDelDia.push(resultadoVenta);
            totalVentas += articulo.precio;

            actualizarPanelVentas();
            renderizarTabla();
            mostrarNotificacion(`Venta registrada: ${articulo.equipo} - ${articulo.jugador}`, 'success');

        } catch (error) {
            console.error('Error en venta:', error);
            mostrarNotificacion('Error al registrar venta', 'error');
        }
    }

    // Función para renderizar la tabla
    function renderizarTabla(items = inventario) {
        if (!tabla) return;

        tabla.innerHTML = '';

        if (items.length === 0) {
            tabla.innerHTML = '<tr><td colspan="10">No hay artículos en el inventario</td></tr>';
            return;
        }

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
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
            `;
            tabla.appendChild(tr);
        });

        agregarEventosBotones();
    }

    // Función para agregar eventos a los botones
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

    // Función para preparar la edición
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
        btnAgregar.scrollIntoView({ behavior: 'smooth' });
    }

    // Funciones auxiliares
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

    // Funciones de filtrado
    function filtrarArticulos() {
        const busqueda = inputBusqueda.value.trim().toLowerCase();
        if (!busqueda) return;

        inventarioFiltrado = inventario.filter(item =>
            item.equipo.toLowerCase().includes(busqueda) ||
            item.jugador.toLowerCase().includes(busqueda) ||
            item.tipo.toLowerCase().includes(busqueda)
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

    // Funciones de ventas
    function mostrarPanelVentas() {
        if (!ventasPanel) return;
        ventasPanel.style.display = 'flex';
    }

    function ocultarPanelVentas() {
        if (!ventasPanel) return;
        ventasPanel.style.display = 'none';
    }

    function actualizarPanelVentas() {
        if (!listaVentas || !totalVentasElement || !contadorVentas) return;

        listaVentas.innerHTML = '';

        if (ventasDelDia.length === 0) {
            listaVentas.innerHTML = '<div class="sin-ventas">No hay ventas registradas hoy</div>';
        } else {
            ventasDelDia.forEach(venta => {
                const ventaElement = document.createElement('div');
                ventaElement.className = 'venta-item';
                ventaElement.innerHTML = `
                    <div>${new Date(venta.fecha).toLocaleTimeString()}</div>
                    <div>${venta.equipo} - ${venta.jugador} (${venta.talla})</div>
                    <div>${venta.precio.toFixed(2)} €</div>
                    <div>${venta.cantidad} unidad(es)</div>
                `;
                listaVentas.appendChild(ventaElement);
            });
        }

        totalVentasElement.textContent = totalVentas.toFixed(2) + ' €';
        contadorVentas.textContent = ventasDelDia.length;
    }

    async function limpiarVentas() {
        if (!confirm('¿Está seguro de limpiar el registro de ventas?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/sales/clear`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Error al limpiar ventas');

            ventasDelDia = [];
            totalVentas = 0;
            actualizarPanelVentas();
            mostrarNotificacion('Ventas del día reiniciadas', 'success');

        } catch (error) {
            console.error('Error limpiando ventas:', error);
            mostrarNotificacion('Error al limpiar ventas', 'error');
        }
    }

    async function verificarDiaNuevo() {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/check-new-day`);
            const { esNuevoDia, ventas } = await response.json();

            if (esNuevoDia) {
                ventasDelDia = ventas || [];
                totalVentas = ventas.reduce((sum, v) => sum + v.precio, 0) || 0;
                actualizarPanelVentas();
            }
        } catch (error) {
            console.error('Error verificando día nuevo:', error);
        }
    }

    // Funciones de UI
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

    // Función para generar PDF
    function generarPDF() {
        if (!window.jspdf || !window.html2canvas) {
            mostrarNotificacion('Bibliotecas para PDF no cargadas', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const fecha = new Date().toLocaleDateString();

        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Reporte de Inventario', 105, 20, { align: 'center' });

        // Fecha
        doc.setFontSize(12);
        doc.text(`Fecha: ${fecha}`, 105, 30, { align: 'center' });

        // Tabla de productos
        const headers = [['Equipo', 'Jugador', 'Tipo', 'Cantidad', 'Precio']];
        const data = inventario.map(item => [
            item.equipo || '-',
            item.jugador || '-',
            item.tipo || '-',
            item.cantidad || '0',
            `${item.precio?.toFixed(2) || '0.00'} €`
        ]);

        doc.autoTable({
            head: headers,
            body: data,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }
        });

        doc.save(`inventario_${fecha.replace(/\//g, '-')}.pdf`);
    }
});