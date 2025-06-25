document.addEventListener('DOMContentLoaded', function() {
    // Array para almacenar los artículos
    let inventario = JSON.parse(localStorage.getItem('inventarioCamisetas')) || [];
    
    // Elementos del DOM
    const form = document.getElementById('form-articulo');
    const tabla = document.getElementById('cuerpo-tabla');
    const inputBusqueda = document.getElementById('busqueda');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnReset = document.getElementById('btn-reset');
    
    // Evento para agregar artículo
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        agregarArticulo();
    });

    // Función para agregar artículo
    function agregarArticulo() {
        // Obtener valores del formulario
        const equipo = document.getElementById('equipo').value.trim();
        const jugador = document.getElementById('jugador').value.trim();
        const temporada = document.getElementById('temporada').value.trim();
        const talla = document.getElementById('talla').value;
        const tipo = document.getElementById('tipo').value;
        const cantidad = parseInt(document.getElementById('cantidad').value);
        const precio = parseFloat(document.getElementById('precio').value);
        
        // Validación
        if (!equipo || !jugador) {
            mostrarError('Por favor complete equipo y jugador');
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

    // Función para renderizar la tabla
    function renderizarTabla(items = inventario) {
        tabla.innerHTML = '';
        
        if (items.length === 0) {
            tabla.innerHTML = '<tr><td colspan="8">No hay artículos en el inventario</td></tr>';
            return;
        }
        
        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.equipo || '-'}</td>
                <td>${item.jugador || '-'}</td>
                <td>${item.temporada || '-'}</td>
                <td>${item.talla || '-'}</td>
                <td>${item.cantidad || 0}</td>
                <td>${item.precio ? item.precio.toFixed(2) : '0.00'} €</td>
                <td>${item.tipo || '-'}</td>
                <td class="acciones">
                    <button class="editar" data-id="${index}">Editar</button>
                    <button class="eliminar" data-id="${index}">Eliminar</button>
                </td>
            `;
            tabla.appendChild(tr);
        });
        
        // Agregar eventos a los botones
        agregarEventosBotones();
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
                editarArticulo(id);
            });
        });
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

    // Función para editar artículo
    function editarArticulo(id) {
        const articulo = inventario[id];
        if (!articulo) return;
        
        // Llenar formulario con los datos
        document.getElementById('equipo').value = articulo.equipo;
        document.getElementById('jugador').value = articulo.jugador;
        document.getElementById('temporada').value = articulo.temporada;
        document.getElementById('talla').value = articulo.talla;
        document.getElementById('tipo').value = articulo.tipo;
        document.getElementById('cantidad').value = articulo.cantidad;
        document.getElementById('precio').value = articulo.precio;
        
        // Eliminar el artículo antiguo
        inventario.splice(id, 1);
        
        // Cambiar texto del botón
        const btnSubmit = document.getElementById('btn-agregar');
        btnSubmit.textContent = 'Actualizar Artículo';
        
        // Cambiar temporalmente el evento del formulario
        form.removeEventListener('submit', agregarArticulo);
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            agregarArticulo();
            btnSubmit.textContent = 'Agregar al Inventario';
            form.addEventListener('submit', agregarArticulo);
        });
    }

    // Función para filtrar
    function filtrarArticulos() {
        const busqueda = inputBusqueda.value.toLowerCase();
        const resultados = inventario.filter(item => 
            item.equipo.toLowerCase().includes(busqueda) || 
            item.jugador.toLowerCase().includes(busqueda)
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

    // Event Listeners adicionales
    btnFiltrar.addEventListener('click', filtrarArticulos);
    btnReset.addEventListener('click', () => {
        inputBusqueda.value = '';
        renderizarTabla();
    });

    // Inicializar la tabla al cargar
    renderizarTabla();
});