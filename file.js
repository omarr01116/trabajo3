// file.js - Lógica principal de la página de gestión de archivos

// NOTA: Las variables SUPABASE_URL, SUPABASE_ANON_KEY y la instancia 'supabase'
// se asumen definidas en auth.js, que DEBE cargarse antes.

// =================================================================
// 🔹 Variables de Estado (DOM Elements)
// =================================================================
const uploadForm = document.getElementById('upload-form');
const cursoSelect = document.getElementById('curso-select');
const semanaSelect = document.getElementById('semana-select');
const fileInput = document.getElementById('file-input');
const fileListBody = document.getElementById('file-list-body');
const fileStatus = document.getElementById('file-status');
const roleDisplay = document.getElementById('role-display');
const logoutBtn = document.getElementById('logout-btn');

// Modal y elementos de previsualización
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'), {});
const previewTitle = document.getElementById('previewModalLabel');
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');

// Estado de la sesión (se inicializa con localStorage)
let role = localStorage.getItem('role') || 'usuario';

// Define la URL de redirección si no hay sesión
const LOGIN_URL = "./login.html"; 

// =================================================================
// 🔹 Funciones de Utilidad y UI
// =================================================================

/** Detecta el tipo de archivo para la previsualización */
function detectType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) return "document";
    return "other";
}

/** Muestra un mensaje de estado */
function setEstado(msg, isError = false) {
    fileStatus.textContent = msg;
    fileStatus.classList.remove('d-none');
    fileStatus.classList.toggle('text-pink-700', !isError); 
    fileStatus.classList.toggle('text-danger', isError);   
}

/** Oculta el mensaje de estado */
function clearEstado() {
    fileStatus.textContent = '';
    fileStatus.classList.add('d-none');
}

// =================================================================
// 🔹 Funciones de Inicialización y Autenticación (¡CORRECCIÓN CLAVE!)
// =================================================================

/**
 * Verifica la sesión con Supabase y protege la ruta.
 * Asume que 'supabase' está definida en auth.js
 */
async function checkAuthAndInit() {
    // 1. Verificar sesión de Supabase
    const { data: { session } } = await supabase.auth.getSession();

    // 🚨 CORRECCIÓN CLAVE: Si NO hay sesión, forzar la redirección a login.
    if (!session) {
        console.warn("🚫 Sesión no encontrada. Redirigiendo a login.");
        window.location.href = LOGIN_URL;
        return; 
    }
    
    // 2. Obtener el rol (ya debería estar en localStorage por auth.js)
    role = localStorage.getItem('role') || 'usuario';
    
    // 3. (Opcional) Verificar si el rol es 'invitado' y redirigir a portafolio
    if (role === 'invitado') {
        console.warn("🚫 Acceso denegado a esta página para invitados. Redirigiendo.");
        window.location.href = './portafolio.html';
        return;
    }

    // Si pasamos las validaciones, inicializar la UI
    console.log(`✅ Acceso concedido. Inicializando UI para rol: ${role.toUpperCase()}`);
    roleDisplay.textContent = role.toUpperCase();

    // 4. Cargar la lista inicial de archivos y asignar listeners
    cargarArchivos();
    uploadForm.addEventListener('submit', handleUpload);
    cursoSelect.addEventListener('change', cargarArchivos);
    semanaSelect.addEventListener('change', cargarArchivos);
    logoutBtn.addEventListener('click', handleLogout);
}


// =================================================================
// 🔹 Cargar Archivos por curso y semana
// =================================================================
async function cargarArchivos() {
    setEstado("⏳ Cargando archivos...");
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    
    // Placeholder de carga mientras se ejecuta la consulta
    fileListBody.innerHTML = `
        <tr>
            <td colspan="2" class="text-center py-4 text-secondary font-semibold">
                Cargando...
            </td>
        </tr>`;

    try {
        const { data, error } = await supabase.storage
            .from("archivos")
            .list(`${curso}/${semana}`, { limit: 100 });

        if (error) throw error;
        
        // Limpiar lista anterior
        fileListBody.innerHTML = ''; 

        if (data && data.length > 0) {
            data.forEach(archivo => {
                const publicData = supabase.storage
                    .from("archivos")
                    .getPublicUrl(`${curso}/${semana}/${archivo.name}`);
                const publicUrl = publicData.data?.publicUrl || "";
                
                // Crear fila de tabla
                const row = fileListBody.insertRow();
                row.className = 'border-t hover:bg-light transition';

                // Columna Nombre del Archivo
                const nameCell = row.insertCell();
                nameCell.className = 'py-3 px-4 text-sm text-primary font-medium break-words';
                nameCell.innerHTML = `<button onclick="openPreview('${archivo.name.replace(/'/g, "\\'")}')" class="btn btn-link p-0 text-decoration-none text-start">${archivo.name}</button>`;

                // Columna Acciones
                const actionsCell = row.insertCell();
                actionsCell.className = 'py-3 px-4 text-center space-x-2';
                actionsCell.innerHTML = `
                    <button onclick="openPreview('${archivo.name.replace(/'/g, "\\'")}')" class="btn btn-sm btn-primary rounded-pill font-medium">Ver</button>
                    ${role === 'admin' ? 
                        `<button onclick="handleDelete('${archivo.name.replace(/'/g, "\\'")}')" class="btn btn-sm btn-danger rounded-pill font-medium delete-btn">Borrar</button>` 
                        : ''
                    }
                `;
            });
            clearEstado();
        } else {
            setEstado("📭 Sin archivos en esta semana/curso");
            fileListBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center py-4 text-secondary font-semibold">
                        📭 No hay archivos en este curso/semana
                    </td>
                </tr>`;
        }
    } catch (err) {
        console.error("Error al cargar archivos:", err);
        setEstado("❌ Error al obtener archivos", true);
    }
}

// =================================================================
// 🔹 Subir archivo
// =================================================================
async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setEstado("⚠️ Selecciona un archivo primero", true);
    if (role !== 'admin' && role !== 'usuario') return setEstado("⚠️ Debes tener un rol válido para subir archivos.", true);

    setEstado("⏳ Subiendo...");
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    const filePath = `${curso}/${semana}/${file.name}`;

    try {
        const { error } = await supabase.storage
            .from("archivos")
            .upload(filePath, file, { upsert: true });

        if (error) throw error;

        setEstado("✅ Archivo subido con éxito");
        fileInput.value = ''; // Limpiar input
        cargarArchivos();
    } catch (err) {
        console.error("Error al subir archivo:", err);
        setEstado("❌ Error al subir archivo: " + err.message, true);
    }
}

// =================================================================
// 🔹 Borrar archivo (solo admin)
// =================================================================
async function handleDelete(fileName) {
    if (role !== "admin") return setEstado("⚠️ Solo el admin puede eliminar archivos.", true);

    const confirmed = confirm(`¿Eliminar ${fileName}?`);
    if (!confirmed) return;

    const curso = cursoSelect.value;
    const semana = semanaSelect.value;

    try {
        const { error } = await supabase.storage
            .from("archivos")
            .remove([`${curso}/${semana}/${fileName}`]);

        if (error) throw error;

        setEstado("🗑️ Archivo eliminado correctamente");
        cargarArchivos();
    } catch (err) {
        setEstado("❌ Error al eliminar archivo", true);
        console.error("Error al eliminar archivo:", err);
    }
}

// =================================================================
// 🔹 Vista previa
// =================================================================
function openPreview(fileName) {
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    
    const { data: publicData } = supabase.storage
        .from("archivos")
        .getPublicUrl(`${curso}/${semana}/${fileName}`);

    const publicUrl = publicData?.publicUrl || null;
    const type = detectType(fileName);

    if (!publicUrl) {
        setEstado("⚠️ No se pudo obtener la URL pública del archivo", true);
        return;
    }

    // Configurar el Modal
    previewTitle.textContent = `Vista Previa - ${fileName}`;
    previewLink.href = publicUrl;
    
    let contentHTML;
    
    if (type === "image") {
        contentHTML = `<img src="${publicUrl}" alt="${fileName}" class="img-fluid" style="max-height: 100%; object-fit: contain;">`;
    } else if (type === "pdf") {
        contentHTML = `<iframe src="${publicUrl}" title="Vista previa PDF" class="w-100 h-100 border-0"></iframe>`;
    } else if (type === "document") {
        // Uso de Google Docs Viewer para documentos 
        contentHTML = `
            <iframe 
                src="https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true" 
                title="Vista previa documento" 
                class="w-100 h-100 border-0"
            ></iframe>
            <div class="text-center p-3 bg-light">
                <small class="text-muted">Si la previsualización falla, use el botón "Abrir en nueva pestaña" para descargar/ver.</small>
            </div>
        `;
    } else {
        contentHTML = `<p class="text-center text-muted p-5">No se puede previsualizar este tipo de archivo. Descárguelo o ábralo en una nueva pestaña.</p>`;
    }
    
    previewContent.innerHTML = contentHTML;
    
    // Mostrar el Modal
    previewModal.show();
}

// =================================================================
// 🔹 Logout
// =================================================================
async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.clear();
    // Redirigir al login
    window.location.href = LOGIN_URL; 
}

// =================================================================
// 🔹 Inicialización
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // La función que contiene toda la lógica de validación e inicialización
    checkAuthAndInit();
});

// Exponer funciones al scope global para que los botones dinámicos de la tabla funcionen
window.openPreview = openPreview;
window.handleDelete = handleDelete;