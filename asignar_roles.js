// =======================================================
// asignar_roles.js - VERSIÓN FINAL Y SEGURA (SIN FILTRO DE FECHA)
// =======================================================

// 🚨 INGRESA AQUÍ LA CLAVE PÚBLICA (ANON KEY) DE TU PROYECTO SUPABASE
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo'; 

// 🔑 CLAVE: Inicializa el cliente usando la variable global del CDN
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

const PROFILE_TABLE = 'profiles'; 

// =================================================================
// 🔹 DOM Elements
// =================================================================
const authStatusBox = document.getElementById('auth-status-box');
const loggedUserEmail = document.getElementById('logged-user-email');
const loggedUserRole = document.getElementById('logged-user-role');
const loggedUserRoleNav = document.getElementById('logged-user-role-nav'); 

const userListContainer = document.getElementById('user-list-container');
const userStatus = document.getElementById('user-status');
const searchInput = document.getElementById('search-input');
const roleFilter = document.getElementById('role-filter');
// const dateFilter = document.getElementById('date-filter'); // <--- ELIMINADO

const logoutBtn = document.getElementById('logout-btn'); 

let allUsers = []; 

// =================================================================
// 🔹 Supabase Auth State y LocalStorage
// =================================================================

/**
 * Actualiza la sección de estado del usuario logueado y aplica restricción de acceso.
 */
async function updateAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    const currentRole = localStorage.getItem("role");

    // Usamos verificaciones opcionales para evitar errores si algún elemento DOM no existe
    if (session && session.user) {
        if (loggedUserEmail) {
            loggedUserEmail.textContent = session.user.email || 'N/A';
            loggedUserEmail.classList.remove('text-warning');
            loggedUserEmail.classList.add('text-success');
        }
        if (loggedUserRole) loggedUserRole.textContent = currentRole || 'Rol Desconocido'; 
        if (loggedUserRoleNav) loggedUserRoleNav.textContent = currentRole?.toUpperCase() || 'N/A';
        if (authStatusBox) {
            authStatusBox.classList.remove('border');
            authStatusBox.classList.add('border-success');
        }
        
        // RESTRICCIÓN DE ACCESO: Solo 'admin' (minúscula)
        if (currentRole !== 'admin') {
             console.warn(`Acceso denegado: El usuario ${currentRole} no tiene permiso para ver esta página.`);
             // Redirige si no es admin
             window.location.href = 'file1.html'; 
        }

    } else {
        // No logueado o sesión expirada
        if (loggedUserEmail) {
            loggedUserEmail.textContent = 'No logueado';
            loggedUserEmail.classList.remove('text-success');
            loggedUserEmail.classList.add('text-warning');
        }
        if (loggedUserRole) loggedUserRole.textContent = 'N/A';
        if (loggedUserRoleNav) loggedUserRoleNav.textContent = 'Invitado';
        if (authStatusBox) {
            authStatusBox.classList.remove('border-success');
            authStatusBox.classList.add('border');
        }
        
        // Si no hay sesión, redirigir al login.
        window.location.href = 'login.html';
    }
}

/**
 * Configura la escucha en tiempo real de los cambios de autenticación de Supabase.
 */
function setupSupabaseAuthListener() {
    supabase.auth.onAuthStateChange(() => {
        updateAuthStatus();
    });
    // Llamar una vez para establecer el estado inicial al cargar la página
    updateAuthStatus(); 
}

/**
 * Maneja el cierre de sesión del usuario.
 */
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        window.location.href = 'login.html'; 
    } catch (error) {
        console.error("Error al cerrar sesión:", error.message);
        alert("Hubo un error al cerrar sesión.");
    }
}


// =================================================================
// 🔹 Renderizado, Estilos y Edición
// =================================================================

/**
 * Auxiliar para dar estilo a las insignias de rol (solo admin y usuario).
 */
function getRoleBadgeClass(role) {
    switch (role?.toLowerCase()) {
        case 'admin':
            return 'bg-danger';
        case 'usuario':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

/**
 * Renderiza una fila de usuario en la lista con hora y fecha.
 */
function renderUserRow(user) {
    // Muestra la fecha y hora completa
    const formattedDateTime = new Date(user.created_at).toLocaleString('es-ES', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
    
    const userRole = user.role || 'PENDIENTE';

    const listItem = document.createElement('div');
    listItem.className = 'list-group-item user-row d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3 text-white border-bottom border-secondary';
    
    listItem.innerHTML = `
        <div class="mb-2 mb-md-0" style="flex: 2;">
            <strong class="text-primary">${user.email}</strong>
            <div class="text-muted small">ID: ${user.id.substring(0, 8)}...</div>
        </div>
        <div class="text-center mb-2 mb-md-0" style="flex: 1;">
            <span class="badge ${getRoleBadgeClass(userRole)}">${userRole.toUpperCase()}</span>
        </div>
        <div class="text-center text-muted small mb-2 mb-md-0" style="flex: 1; min-width: 150px;">
            ${formattedDateTime}
        </div>
        <div style="flex: 1; text-align: right;">
            <button 
                class="btn btn-sm btn-warning edit-role-btn" 
                data-id="${user.id}"
                data-email="${user.email}"
                data-current-role="${userRole}"
            >
                <i class="fas fa-user-edit"></i> Editar Rol
            </button>
        </div>
    `;

    userListContainer.appendChild(listItem);
}

/**
 * SUPABASE (UPDATE) - Actualiza el rol en la base de datos y maneja el bug de seguridad.
 */
async function updateUserRole(userId, newRole) {
    // 1. Obtener la sesión actual para saber quién está logueado
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    const isCurrentUser = currentUserId === userId; // ¿Es el usuario logueado?
    
    try {
        const { error } = await supabase
            .from(PROFILE_TABLE) 
            .update({ role: newRole })
            .eq('id', userId)
            .select();

        if (error) throw error;
        
        // --- INICIO CORRECCIÓN DE SEGURIDAD CRÍTICA ---
        if (isCurrentUser) {
            // 🚨 CRÍTICO: Si el administrador se quita el rol 'admin':
            // 1. Limpiamos el localStorage para invalidar su sesión de frontend.
            localStorage.removeItem("role");
            localStorage.removeItem("token");
            
            alert(`✅ ¡Tu rol ha sido cambiado! Debes volver a iniciar sesión para verificar tu nuevo acceso. Serás redirigido.`);
            
            // 2. Redirigimos al login
            window.location.href = 'login.html'; 
            return; // Detenemos la ejecución
        }
        // --- FIN CORRECCIÓN DE SEGURIDAD ---

        // Si es otro usuario, solo recargamos la lista
        await loadAllUsers(); 
        alert(`✅ Rol actualizado exitosamente a ${newRole.toUpperCase()}.`);

    } catch (error) {
        console.error('Error al actualizar el rol:', error.message);
        alert(`❌ Error al actualizar el rol: ${error.message}. Asegúrate de tener permisos RLS de UPDATE.`);
    }
}

/**
 * Manejador de evento para el botón "Editar Rol", que solicita el nuevo rol.
 */
async function handleEditButton(event) {
    const button = event.currentTarget;
    const userId = button.getAttribute('data-id');
    const userEmail = button.getAttribute('data-email');
    const currentRole = button.getAttribute('data-current-role');

    // Muestra un prompt para seleccionar el nuevo rol (admin/usuario)
    const newRole = prompt(
        `Editando rol para: ${userEmail}\nRol actual: ${currentRole.toUpperCase()}\n\nSelecciona el nuevo rol (escribe 'admin' o 'usuario'):`
    );

    if (newRole === null) {
        return; // Cancelado
    }

    const trimmedRole = newRole.toLowerCase().trim();

    if (trimmedRole !== 'admin' && trimmedRole !== 'usuario') {
        alert('Rol no válido. Por favor, escribe exactamente "admin" o "usuario".');
        return;
    }

    if (trimmedRole === currentRole) {
         alert('El rol seleccionado es el mismo que el actual.');
         return;
    }

    // Llama a la función de actualización
    updateUserRole(userId, trimmedRole);
}

// =================================================================
// 🔹 Supabase: Carga, Filtro y Búsqueda
// =================================================================

/**
 * SUPABASE (READ) - Carga la lista inicial de usuarios.
 */
async function loadAllUsers() {
    if (userStatus) userStatus.textContent = 'Cargando usuarios desde Supabase...';
    if (userListContainer) userListContainer.innerHTML = '';
    
    try {
        let { data: users, error } = await supabase
            .from(PROFILE_TABLE)
            .select('id, email, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allUsers = users.map(user => ({
            id: user.id,
            email: user.email || 'No disponible',
            // Asegura que el rol siempre sea minúscula para la lógica interna
            role: user.role?.toLowerCase() || 'usuario', 
            created_at: user.created_at 
        }));
        
        if (userStatus) userStatus.textContent = '';
        filterAndRenderUsers();

    } catch (error) {
        console.error("Error al cargar usuarios de Supabase:", error);
        if (userStatus) userStatus.innerHTML = `<span class="text-danger">❌ Error al cargar usuarios: ${error.message}.
            Verifica tu conexión y las políticas RLS en la tabla ${PROFILE_TABLE}.</span>`;
    }
}

/**
 * Aplica todos los filtros (búsqueda, rol) y renderiza la lista.
 */
function filterAndRenderUsers() {
    if (userListContainer) userListContainer.innerHTML = '';
    
    // Solo usamos los dos filtros restantes:
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const role = roleFilter ? roleFilter.value : '';
    // La variable dateStr ya no se declara.
    
    let filteredUsers = allUsers;

    // 1. Filtrar por Búsqueda (Email)
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
            user.email?.toLowerCase().includes(searchTerm)
        );
    }

    // 2. Filtrar por Rol
    if (role) {
        filteredUsers = filteredUsers.filter(user => 
            user.role === role
        );
    }

    // 3. El filtro por fecha ha sido ELIMINADO de aquí.

    if (filteredUsers.length === 0) {
        if (userStatus) userStatus.textContent = "No se encontraron usuarios que coincidan con los filtros.";
        return;
    }
    
    if (userStatus) userStatus.textContent = `Mostrando ${filteredUsers.length} de ${allUsers.length} usuarios.`;
    filteredUsers.forEach(renderUserRow);

    // Adjuntar listeners de edición a los botones recién creados
    document.querySelectorAll('.edit-role-btn').forEach(button => {
        button.addEventListener('click', handleEditButton);
    });
}

// =================================================================
// 🔹 Inicialización
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Configurar listener de autenticación de Supabase
    setupSupabaseAuthListener(); 
    
    // 2. Configurar listeners de filtro (solo si los elementos existen)
    if (searchInput) searchInput.addEventListener('input', filterAndRenderUsers);
    if (roleFilter) roleFilter.addEventListener('change', filterAndRenderUsers);
    // if (dateFilter) dateFilter.addEventListener('change', filterAndRenderUsers); // <--- ELIMINADO
    
    // 3. Configurar listener de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 4. Cargar la lista inicial de usuarios
    loadAllUsers();
});