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

// Nombre del bucket (asumimos que es 'archivos')
const BUCKET_NAME = 'archivos'; 

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
// 🔹 Funciones de Inicialización y Autenticación
// =================================================================

/**
 * Verifica la sesión con Supabase y protege la ruta.
 */
async function checkAuthAndInit() {
    // 1. Verificar sesión de Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = LOGIN_URL;
        return; 
    }
    
    // 2. Obtener el rol 
    role = localStorage.getItem('role') || 'usuario';
    
    // 3. Redirección de rol
    if (role === 'invitado') {
        window.location.href = './portafolio.html';
        return;
    }

    // Si pasamos las validaciones, inicializar la UI
    roleDisplay.textContent = role.toUpperCase();

    // 4. Cargar la lista inicial de archivos y asignar listeners
    cargarArchivos();
    uploadForm.addEventListener('submit', handleUpload);
    cursoSelect.addEventListener('change', cargarArchivos);
    semanaSelect.addEventListener('change', cargarArchivos);
    logoutBtn.addEventListener('click', handleLogout);
}


// =================================================================
// 🔹 Cargar Archivos por curso y semana (Renderizado y Estilo Corregido)
// =================================================================
async function cargarArchivos() {
    setEstado("⏳ Cargando archivos...");
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    const folderPath = `${curso}/${semana}`;
    
    fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">Cargando...</td></tr>`;

    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(folderPath, { limit: 100 });

        if (error) throw error;
        
        fileListBody.innerHTML = ''; 

        if (data && data.length > 0) {
            data.forEach(archivo => {
                const fullPath = `${folderPath}/${archivo.name}`; 
                
                const row = fileListBody.insertRow();
                row.className = 'border-t hover:bg-light transition';

                // Columna Nombre del Archivo
                const nameCell = row.insertCell();
                nameCell.className = 'py-3 px-4 text-sm text-primary font-medium break-words';
                nameCell.innerHTML = `<button onclick="openPreview('${archivo.name.replace(/'/g, "\\'")}')" class="btn btn-link p-0 text-decoration-none text-start">${archivo.name}</button>`;

                // Columna Acciones (Estilo Corregido)
                const actionsCell = row.insertCell();
                // ⭐ Alinear y centrar botones en la celda
                actionsCell.className = 'py-3 px-4 text-center d-flex justify-content-center align-items-center space-x-2';
                actionsCell.innerHTML = `
                    <button onclick="openPreview('${archivo.name.replace(/'/g, "\\'")}')" class="btn btn-sm btn-primary rounded-pill font-medium me-2">Ver</button>
                    
                    ${role === 'admin' ? 
                        // ⭐ BOTÓN EDITAR SOLO PARA ADMIN
                        `<button onclick="handleEdit('${fullPath.replace(/'/g, "\\'")}', '${archivo.name.replace(/'/g, "\\'")}')" 
                            class="btn btn-sm btn-warning rounded-pill font-medium me-2">Editar</button>` 
                        : ''
                    }

                    ${role === 'admin' ? 
                        `<button onclick="handleDelete('${fullPath.replace(/'/g, "\\'")}')" class="btn btn-sm btn-danger rounded-pill font-medium">Borrar</button>` 
                        : ''
                    }
                `;
            });
            clearEstado();
        } else {
            setEstado("📭 Sin archivos en esta semana/curso");
            fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos en este curso/semana</td></tr>`;
        }
    } catch (err) {
        console.error("Error al cargar archivos:", err);
        setEstado("❌ Error al obtener archivos", true);
    }
}

// =================================================================
// 🔹 Subir archivo (Usa el nombre original - Correcto)
// =================================================================
async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setEstado("⚠️ Selecciona un archivo primero", true);
    
    // ⭐ Solo permitir subir a 'admin' o 'usuario'
    if (role !== 'admin' && role !== 'usuario') return setEstado("⚠️ Debes tener un rol válido para subir archivos.", true);

    setEstado("⏳ Subiendo...");
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    // Ya está usando file.name, lo que asegura el nombre original
    const filePath = `${curso}/${semana}/${file.name}`; 

    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
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
// ⭐ 🔹 Renombrar archivo (Solo admin)
// =================================================================
async function handleEdit(oldFullPath, oldFileName) {
    if (role !== "admin") return setEstado("⚠️ Solo el admin puede editar nombres.", true);

    const newName = prompt(`Renombrando "${oldFileName}".\nIngresa el nuevo nombre del archivo (incluye la extensión):`);

    if (!newName || newName.trim() === '' || newName.trim() === oldFileName) {
        return; // Cancelado o nombre no cambiado
    }
    
    setEstado("⏳ Renombrando...");
    
    // newFullPath es oldFullPath con el nombre antiguo reemplazado por el nuevo
    const newFullPath = oldFullPath.replace(oldFileName, newName.trim());

    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .move(oldFullPath, newFullPath); 

        if (error) throw error;

        setEstado(`✏️ Archivo renombrado a: ${newName.trim()}`);
        cargarArchivos();
    } catch (err) {
        setEstado("❌ Error al renombrar archivo", true);
        console.error("Error al renombrar archivo:", err);
    }
}

// =================================================================
// 🔹 Borrar archivo (solo admin)
// =================================================================
async function handleDelete(fullPath) {
    // ⭐ Restricción de rol
    if (role !== "admin") return setEstado("⚠️ Solo el admin puede eliminar archivos.", true);

    const fileName = fullPath.split('/').pop();
    const confirmed = confirm(`¿Eliminar ${fileName}?`);
    if (!confirmed) return;

    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fullPath]); 

        if (error) throw error;

        setEstado("🗑️ Archivo eliminado correctamente");
        cargarArchivos();
    } catch (err) {
        setEstado("❌ Error al eliminar archivo", true);
        console.error("Error al eliminar archivo:", err);
    }
}

// =================================================================
// 🔹 Vista previa (Mejora de Estilo y Detección de Archivos)
// =================================================================
function openPreview(fileName) {
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    
    const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
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
        // ⭐ Usar object-contain para asegurar que la imagen quepa sin cortar
        contentHTML = `<img src="${publicUrl}" alt="${fileName}" class="img-fluid" style="max-height: 100%; object-fit: contain;">`;
    } else if (type === "pdf") {
        // ⭐ Usar un iframe directo para PDFs
        contentHTML = `<iframe src="${publicUrl}" title="Vista previa PDF" class="w-100 h-100 border-0"></iframe>`;
    } else if (type === "document") {
        // ⭐ Mantener Google Docs Viewer para documentos de Office (doc, ppt, xls)
        contentHTML = `
            <iframe 
                src="https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true" 
                title="Vista previa documento" 
                class="w-100 h-100 border-0"
            ></iframe>
            <div class="text-center p-3 bg-light w-100">
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
    window.location.href = LOGIN_URL; 
}

// =================================================================
// 🔹 Inicialización
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInit();
});

// Exponer funciones al scope global
window.openPreview = openPreview;
window.handleDelete = handleDelete;
window.handleEdit = handleEdit;