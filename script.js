document.addEventListener('DOMContentLoaded', function() {
    // Array para almacenar los artículos
    let inventario = JSON.parse(localStorage.getItem('inventarioCamisetas')) || [];
    let articuloEditandoId = null;
    let inventarioFiltrado = null;
    let ventasDelDia = JSON.parse(localStorage.getItem('ventasDelDia')) || [];
    let totalVentas = parseFloat(localStorage.getItem('totalVentas')) || 0;
    
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

    // Inicializar panel de ventas
    actualizarPanelVentas();
    verificarDiaNuevo();

    // Event Listeners
    form.addEventListener('submit', manejarSubmit);
    btnFiltrar.addEventListener('click', filtrarArticulos);
    btnReset.addEventListener('click', () => {
        inputBusqueda.value = '';
        inventarioFiltrado = null;
        renderizarTabla();
    });
    btnFiltrarBajoStock.addEventListener('click', filtrarBajoStock);
    btnVentas.addEventListener('click', mostrarPanelVentas);
    btnCerrarVentas.addEventListener('click', ocultarPanelVentas);
    btnLimpiarVentas.addEventListener('click', limpiarVentas);

    // Función principal para manejar el envío del formulario
    function manejarSubmit(e) {
        e.preventDefault();
        
        if (articuloEditandoId !== null) {
            actualizarArticulo(articuloEditandoId);
        } else {
            agregarArticulo();
        }
    }

    // Función para agregar artículo
    function agregarArticulo() {
        // Obtener valores del formulario
        const equipo = document.getElementById('equipo').value.trim();
        const jugador = document.getElementById('jugador').value.trim();
        const temporada = document.getElementById('temporada').value.trim();
        const color = document.getElementById('color').value.trim();
        const talla = document.getElementById('talla').value;
        const tipo = document.getElementById('tipo').value;
        const cantidad = parseInt(document.getElementById('cantidad').value);
        const precio = parseFloat(document.getElementById('precio').value);
        
        // Validación
        if (!equipo || !jugador || !color) {
            mostrarError('Por favor complete equipo, jugador y color');
            return;
        }
        
        if (isNaN(cantidad) || cantidad <= 0) {
            mostrarError('La cantidad debe ser mayor a 0');
            return;
        }
        
        if (isNaN(precio) || precio <= 0) {
            mostrarError('El precio debe ser válido');
            return;
        }
        
        // Crear nuevo artículo
        const nuevoArticulo = {
            equipo,
            jugador,
            temporada: temporada || '2023-2024',
            color,
            talla,
            tipo,
            cantidad,
            precio
        };
        
        // Agregar al inventario
        inventario.push(nuevoArticulo);
        guardarEnLocalStorage();
        
        // Limpiar formulario y actualizar tabla
        form.reset();
        inventarioFiltrado = null;
        renderizarTabla();
        mostrarNotificacion('Artículo agregado correctamente', 'success');
    }

    // Función para actualizar artículo
    function actualizarArticulo(id) {
        // Obtener valores del formulario
        const equipo = document.getElementById('equipo').value.trim();
        const jugador = document.getElementById('jugador').value.trim();
        const temporada = document.getElementById('temporada').value.trim();
        const color = document.getElementById('color').value.trim();
        const talla = document.getElementById('talla').value;
        const tipo = document.getElementById('tipo').value;
        const cantidad = parseInt(document.getElementById('cantidad').value);
        const precio = parseFloat(document.getElementById('precio').value);
        
        // Validación
        if (!equipo || !jugador || !color) {
            mostrarError('Por favor complete equipo, jugador y color');
            return;
        }
        
        if (isNaN(cantidad) || cantidad <= 0) {
            mostrarError('La cantidad debe ser mayor a 0');
            return;
        }
        
        if (isNaN(precio) || precio <= 0) {
            mostrarError('El precio debe ser válido');
            return;
        }

        // Actualizar el artículo
        inventario[id] = {
            equipo,
            jugador,
            temporada,
            color,
            talla,
            tipo,
            cantidad,
            precio
        };

        guardarEnLocalStorage();
        inventarioFiltrado = null;
        renderizarTabla();
        mostrarNotificacion('Artículo actualizado correctamente', 'success');

        // Restaurar formulario a modo agregar
        form.reset();
        btnAgregar.textContent = 'Agregar al Inventario';
        articuloEditandoId = null;
    }

    // Función para renderizar la tabla
    function renderizarTabla(items = inventario) {
        tabla.innerHTML = '';
        
        if (items.length === 0) {
            tabla.innerHTML = '<tr><td colspan="10">No hay artículos en el inventario</td></tr>';
            return;
        }
        
        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            const idReal = inventarioFiltrado ? inventario.findIndex(art => 
                art.equipo === item.equipo && 
                art.jugador === item.jugador &&
                art.temporada === item.temporada &&
                art.color === item.color &&
                art.talla === item.talla &&
                art.tipo === item.tipo
            ) : index;
            
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
                    <button class="editar" data-id="${idReal}">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="eliminar" data-id="${idReal}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
                <td class="venta-celda">
                    <button class="btn-vender" data-id="${idReal}" ${item.cantidad <= 0 ? 'disabled' : ''}>
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
        // Botones de eliminar
        document.querySelectorAll('.eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                eliminarArticulo(id);
            });
        });
        
        // Botones de editar
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                prepararEdicion(id);
            });
        });
        
        // Botones de vender
        document.querySelectorAll('.btn-vender').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                venderArticulo(id);
            });
        });
    }

    // Función para vender artículo
    function venderArticulo(id) {
        const articulo = inventario[id];
        
        if (articulo.cantidad > 0) {
            // Restar una unidad
            articulo.cantidad--;
            
            // Registrar la venta
            const venta = {
                fecha: new Date().toLocaleTimeString(),
                equipo: articulo.equipo,
                jugador: articulo.jugador,
                talla: articulo.talla,
                precio: articulo.precio,
                cantidad: 1
            };
            
            ventasDelDia.push(venta);
            totalVentas += articulo.precio;
            
            // Actualizar almacenamiento y UI
            guardarEnLocalStorage();
            guardarVentas();
            actualizarPanelVentas();
            renderizarTabla();
            
            mostrarNotificacion(`Venta registrada: ${articulo.equipo} - ${articulo.jugador}`, 'success');
        } else {
            mostrarNotificacion('No hay stock disponible', 'error');
        }
    }

    // Función para preparar la edición
    function prepararEdicion(id) {
        const articulo = inventario[id];
        if (!articulo) return;
        
        articuloEditandoId = id;

        // Llenar formulario con los valores correctos
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

    // Función para eliminar artículo
    function eliminarArticulo(id) {
        if (confirm('¿Está seguro de eliminar este artículo?')) {
            inventario.splice(id, 1);
            guardarEnLocalStorage();
            inventarioFiltrado = null;
            renderizarTabla();
            mostrarNotificacion('Artículo eliminado', 'success');
        }
    }

    // Función para filtrar
    function filtrarArticulos() {
        const busqueda = inputBusqueda.value.toLowerCase();
        inventarioFiltrado = inventario.filter(item => 
            item.equipo.toLowerCase().includes(busqueda) || 
            item.jugador.toLowerCase().includes(busqueda) ||
            item.color.toLowerCase().includes(busqueda)
        );
        renderizarTabla(inventarioFiltrado);
    }

    // Función para filtrar por bajo stock
    function filtrarBajoStock() {
        inventarioFiltrado = inventario.filter(item => item.cantidad <= 1);
        renderizarTabla(inventarioFiltrado);
    }

    // Función para mostrar el panel de ventas
    function mostrarPanelVentas() {
        ventasPanel.style.display = 'flex';
    }

    // Función para ocultar el panel de ventas
    function ocultarPanelVentas() {
        ventasPanel.style.display = 'none';
    }

    // Función para actualizar el panel de ventas
    function actualizarPanelVentas() {
        listaVentas.innerHTML = '';
        
        if (ventasDelDia.length === 0) {
            listaVentas.innerHTML = '<div class="sin-ventas">No hay ventas registradas hoy</div>';
        } else {
            ventasDelDia.forEach((venta, index) => {
                const ventaElement = document.createElement('div');
                ventaElement.className = 'venta-item';
                ventaElement.innerHTML = `
                    <div>${venta.fecha}</div>
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

    // Función para limpiar las ventas
    function limpiarVentas() {
        if (confirm('¿Está seguro de limpiar el registro de ventas?')) {
            ventasDelDia = [];
            totalVentas = 0;
            guardarVentas();
            actualizarPanelVentas();
            mostrarNotificacion('Ventas del día reiniciadas', 'success');
        }
    }

    // Función para guardar en localStorage
    function guardarEnLocalStorage() {
        localStorage.setItem('inventarioCamisetas', JSON.stringify(inventario));
    }

    // Función para guardar ventas
    function guardarVentas() {
        localStorage.setItem('ventasDelDia', JSON.stringify(ventasDelDia));
        localStorage.setItem('totalVentas', totalVentas);
    }

    // Función para verificar si es un nuevo día
    function verificarDiaNuevo() {
        const hoy = new Date().toLocaleDateString();
        const ultimaFecha = localStorage.getItem('ultimaFechaVentas');
        
        if (ultimaFecha !== hoy) {
            ventasDelDia = [];
            totalVentas = 0;
            guardarVentas();
            localStorage.setItem('ultimaFechaVentas', hoy);
            actualizarPanelVentas();
        }
    }

    // Función para mostrar notificaciones
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
            setTimeout(() => {
                notificacion.remove();
            }, 300);
        }, 3000);
    }

    // Función para mostrar errores
    function mostrarError(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${mensaje}</span>
        `;
        
        const formContainer = document.querySelector('.form-container');
        formContainer.insertBefore(errorDiv, formContainer.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Configuración para jsPDF (al inicio del archivo)
const { jsPDF } = window.jspdf;

// Event listener para el botón de PDF (añade esto donde configuras los event listeners)
document.getElementById('btn-descargar-pdf').addEventListener('click', generarPDF);

// Función para generar PDF
function generarPDF() {
    const panel = document.getElementById('ventas-panel');
    const fecha = new Date().toLocaleDateString();
    
    // Crear un clon para evitar afectar la visualización
    const panelClone = panel.cloneNode(true);
    panelClone.style.width = '350px';
    panelClone.style.position = 'absolute';
    panelClone.style.left = '-9999px';
    document.body.appendChild(panelClone);

    // Ocultar botones en el PDF
    panelClone.querySelectorAll('button').forEach(btn => {
        btn.style.display = 'none';
    });

    html2canvas(panelClone, {
        scale: 2, // Mejor calidad
        logging: false,
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.setFontSize(18);
        pdf.text('Reporte de Ventas', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(fecha, 105, 30, { align: 'center' });
        
        pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight);
        pdf.save(`ventas_${fecha.replace(/\//g, '-')}.pdf`);
        
        // Eliminar el clon
        document.body.removeChild(panelClone);
    });
}

    // Inicializar la tabla al cargar
    renderizarTabla();
});