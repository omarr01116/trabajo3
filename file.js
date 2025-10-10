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
const previewFileNameSpan = document.getElementById('preview-filename'); 

// Estado de la sesión (se inicializa con localStorage)
let role = localStorage.getItem('role') || 'usuario';

// Define la URL de redirección si no hay sesión
const LOGIN_URL = "./login.html"; 

// Nombre del bucket de Supabase Storage
const BUCKET_NAME = 'archivos'; 

// =================================================================
// 🔹 Funciones de Utilidad y UI
// =================================================================

/** Detecta el tipo de archivo para la previsualización */
function detectType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    // Documentos de Office que requieren el visor de Google Docs
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

/**
 * CODIFICACIÓN CRÍTICA: Codifica una ruta para Supabase Storage.
 * Codifica caracteres especiales y espacios, pero deja las barras inclinadas ('/') sin codificar.
 * Esto es NECESARIO para que la API de Storage reconozca las carpetas.
 */
function getPathForStorage(path) {
    // 1. Codifica la ruta completa (espacios a %20, / a %2F)
    let encodedPath = encodeURIComponent(path);
    // 2. Deshace la codificación de la barra inclinada ('%2F' a '/')
    return encodedPath.replace(/%2F/g, '/');
}

// =================================================================
// 🔹 Funciones de Inicialización y Autenticación
// =================================================================

/**
 * Verifica la sesión con Supabase y protege la ruta.
 */
async function checkAuthAndInit() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = LOGIN_URL;
        return; 
    }
    
    role = localStorage.getItem('role') || 'usuario';
    
    if (role === 'invitado') {
        window.location.href = './portafolio.html';
        return;
    }

    roleDisplay.textContent = role.toUpperCase();

    cargarArchivos();
    uploadForm.addEventListener('submit', handleUpload);
    cursoSelect.addEventListener('change', cargarArchivos);
    semanaSelect.addEventListener('change', cargarArchivos);
    logoutBtn.addEventListener('click', handleLogout);
}


// =================================================================
// 🔹 Cargar Archivos (Renderizado de tabla)
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
                
                // Escapamos solo comillas simples para el onclick
                const safeFileName = archivo.name.replace(/'/g, "\\'");
                nameCell.innerHTML = `<button onclick="openPreview('${safeFileName}')" class="btn btn-link p-0 text-decoration-none text-start">${archivo.name}</button>`;

                // Columna Acciones (Restricción por Rol)
                const actionsCell = row.insertCell();
                actionsCell.className = 'py-3 px-4 text-center d-flex justify-content-center align-items-center';

                // Escapamos fullPath y fileName para pasar a handleEdit/handleDelete de forma segura
                const safeFullPath = fullPath.replace(/'/g, "\\'");

                actionsCell.innerHTML = `
                    <button onclick="openPreview('${safeFileName}')" class="btn btn-sm btn-primary rounded-pill font-medium me-2">Ver</button>
                    
                    ${role === 'admin' ? 
                        `<button onclick="handleEdit('${safeFullPath}', '${safeFileName}')" 
                            class="btn btn-sm btn-warning rounded-pill font-medium me-2">Editar</button>` 
                        : ''
                    }

                    ${role === 'admin' ? 
                        `<button onclick="handleDelete('${safeFullPath}')" class="btn btn-sm btn-danger rounded-pill font-medium">Borrar</button>` 
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
// 🔹 Subir archivo (Restricción de rol a admin/usuario)
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
            .from(BUCKET_NAME)
            .upload(filePath, file, { upsert: true });

        if (error) throw error;

        setEstado("✅ Archivo subido con éxito");
        fileInput.value = ''; 
        cargarArchivos();
    } catch (err) {
        console.error("Error al subir archivo:", err);
        setEstado("❌ Error al subir archivo: " + err.message, true);
    }
}

// =================================================================
// 🔹 Renombrar archivo (Solo admin) - CÓDIGO FINAL
// =================================================================
async function handleEdit(oldFullPath, oldFileName) {
    if (role !== "admin") return setEstado("⚠️ Solo el admin puede editar nombres.", true);

    const newName = prompt(`Renombrando "${oldFileName}".\nIngresa el nuevo nombre del archivo (incluye la extensión):`);

    if (!newName || newName.trim() === '' || newName.trim() === oldFileName) {
        return; 
    }
    
    setEstado("⏳ Renombrando...");
    
    // 1. Limpiamos las comillas escapadas que vienen del onclick (CRÍTICO)
    const cleanOldFullPath = oldFullPath.replace(/\\'/g, "'"); 
    const cleanOldFileName = oldFileName.replace(/\\'/g, "'");

    // 2. Crear la nueva ruta completa
    const newFullPath = cleanOldFullPath.replace(cleanOldFileName, newName.trim());

    // 3. Aplicamos la codificación robusta a ambas rutas para la API de Supabase
    const encodedOldPath = getPathForStorage(cleanOldFullPath);
    const encodedNewPath = getPathForStorage(newFullPath);

    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .move(encodedOldPath, encodedNewPath); 

        if (error) throw error;

        setEstado(`✏️ Archivo renombrado a: ${newName.trim()}`);
        cargarArchivos();
    } catch (err) {
        const errorMsg = err.message || "Error desconocido";
        setEstado(`❌ Error al renombrar archivo: ${errorMsg}`, true);
        console.error("Error al renombrar archivo:", err);
    }
}

// =================================================================
// 🔹 Borrar archivo (solo admin)
// =================================================================
async function handleDelete(fullPath) {
    if (role !== "admin") return setEstado("⚠️ Solo el admin puede eliminar archivos.", true);

    // Limpiamos las comillas escapadas que vienen del onclick
    const cleanFullPath = fullPath.replace(/\\'/g, "'"); 

    const fileName = cleanFullPath.split('/').pop();
    const confirmed = confirm(`¿Eliminar ${fileName}?`);
    if (!confirmed) return;

    setEstado("⏳ Eliminando...");
    
    // Aplicamos la codificación robusta para el borrado
    const encodedPath = getPathForStorage(cleanFullPath);

    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([encodedPath]); // .remove espera un array de paths codificados

        if (error) throw error;

        setEstado("🗑️ Archivo eliminado correctamente");
        cargarArchivos();
    } catch (err) {
        const errorMsg = err.message || "Error desconocido";
        setEstado(`❌ Error al eliminar archivo: ${errorMsg}`, true);
        console.error("Error al eliminar archivo:", err);
    }
}

// =================================================================
// 🔹 Vista previa (Corregida para alineación de Bootstrap)
// =================================================================
function openPreview(fileName) {
    const curso = cursoSelect.value;
    const semana = semanaSelect.value;
    
    // CRÍTICO: El nombre del archivo debe codificarse para la URL pública si tiene espacios/caracteres especiales
    const encodedFileName = encodeURIComponent(fileName);

    const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${curso}/${semana}/${encodedFileName}`);

    const publicUrl = publicData?.publicUrl || null;
    const type = detectType(fileName);

    if (!publicUrl) {
        setEstado("⚠️ No se pudo obtener la URL pública del archivo", true);
        return;
    }

    // Limpiar antes de configurar el nuevo contenido
    previewContent.innerHTML = ''; 

    // Configurar el Modal
    if (previewFileNameSpan) {
        previewFileNameSpan.textContent = fileName;
    }
    
    previewLink.href = publicUrl;
    
    let contentHTML;
    
    if (type === "image") {
        contentHTML = `<div class="w-100 h-100 d-flex justify-content-center align-items-center">
            <img 
                src="${publicUrl}" 
                alt="${fileName}" 
                class="img-fluid" 
                style="max-height: 100%; max-width: 100%; object-fit: contain;"
            >
        </div>`;
    } else if (type === "pdf" || type === "document") {
        
        let iframeSrc = publicUrl;
        if (type === "document") {
            iframeSrc = `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;
        }

        contentHTML = `
            <div class="w-100 h-100 d-flex flex-column">
                <iframe 
                    src="${iframeSrc}" 
                    title="Vista previa ${type}" 
                    class="w-100 border-0"
                    style="flex-grow: 1; height: 100%;" 
                ></iframe>
                <div class="text-center p-2 bg-light w-100 flex-shrink-0 border-top">
                    <small class="text-muted">Si la previsualización falla, use el botón "Abrir en nueva pestaña" para descargar/ver.</small>
                </div>
            </div>
        `;
    } else {
        contentHTML = `<p class="text-center text-muted p-5">No se puede previsualizar este tipo de archivo. Descárguelo o ábralo en una nueva pestaña.</p>`;
    }
    
    previewContent.innerHTML = contentHTML;
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

// Exponer funciones al scope global (necesario para onclick en el HTML generado)
window.openPreview = openPreview;
window.handleDelete = handleDelete;
window.handleEdit = handleEdit;