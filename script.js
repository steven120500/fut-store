document.addEventListener('DOMContentLoaded', function() {
    // Array para almacenar los artículos
    let inventario = JSON.parse(localStorage.getItem('inventarioCamisetas')) || [];
    let articuloEditandoId = null;
    
    // Elementos del DOM
    const form = document.getElementById('form-articulo');
    const tabla = document.getElementById('cuerpo-tabla');
    const inputBusqueda = document.getElementById('busqueda');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnReset = document.getElementById('btn-reset');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnFiltrarBajoStock = document.getElementById('btn-filtrar-bajo-stock');

    // Event Listeners
    form.addEventListener('submit', manejarSubmit);
    btnFiltrar.addEventListener('click', filtrarArticulos);
    btnReset.addEventListener('click', () => {
        inputBusqueda.value = '';
        renderizarTabla();
    });
    btnFiltrarBajoStock.addEventListener('click', filtrarBajoStock);

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
            tabla.innerHTML = '<tr><td colspan="9">No hay artículos en el inventario</td></tr>';
            return;
        }
        
        items.forEach((item, index) => {
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
                    <button class="editar" data-id="${index}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="eliminar" data-id="${index}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tabla.appendChild(tr);
        });
        
        agregarEventosBotones();
    }

    // Función para filtrar artículos con bajo stock
    function filtrarBajoStock() {
        const bajoStock = inventario.filter(item => item.cantidad <= 1);
        renderizarTabla(bajoStock);
    }

    // Función para agregar eventos a los botones
    function agregarEventosBotones() {
        // Botones de eliminar
        document.querySelectorAll('.eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarArticulo(id);
            });
        });
        
        // Botones de editar
        document.querySelectorAll('.editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                prepararEdicion(id);
            });
        });
    }

    // Función para preparar la edición
    function prepararEdicion(id) {
        const articulo = inventario[id];
        if (!articulo) return;
        
        articuloEditandoId = id;

        // Llenar formulario
        document.getElementById('equipo').value = articulo.equipo || '';
        document.getElementById('jugador').value = articulo.jugador || '';
        document.getElementById('temporada').value = articulo.temporada || '';
        document.getElementById('color').value = articulo.color || '';
        document.getElementById('talla').value = articulo.talla || 'M';
        document.getElementById('tipo').value = articulo.tipo || 'Retro';
        document.getElementById('cantidad').value = articulo.cantidad || 1;
        document.getElementById('precio').value = articulo.precio || 0;

        btnAgregar.textContent = 'Actualizar Artículo';
    }

    // Función para eliminar artículo
    function eliminarArticulo(id) {
        if (confirm('¿Está seguro de eliminar este artículo?')) {
            inventario.splice(id, 1);
            guardarEnLocalStorage();
            renderizarTabla();
            mostrarNotificacion('Artículo eliminado', 'success');
        }
    }

    // Función para filtrar
    function filtrarArticulos() {
        const busqueda = inputBusqueda.value.toLowerCase();
        const resultados = inventario.filter(item => 
            item.equipo.toLowerCase().includes(busqueda) || 
            item.jugador.toLowerCase().includes(busqueda) ||
            item.color.toLowerCase().includes(busqueda)
        );
        renderizarTabla(resultados);
    }

    // Función para guardar en localStorage
    function guardarEnLocalStorage() {
        localStorage.setItem('inventarioCamisetas', JSON.stringify(inventario));
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo) {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }

    // Función para mostrar errores
    function mostrarError(mensaje) {
        alert(mensaje);
    }

    // Inicializar la tabla al cargar
    renderizarTabla();
});