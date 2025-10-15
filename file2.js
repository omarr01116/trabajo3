// ======================================================================
// file2.js (ROL ADMIN) - CÓDIGO FINAL CORREGIDO
// ======================================================================

// 🔑 Cliente Supabase (solo para autenticación)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

// 🌐 CONFIGURACIÓN BACKEND
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`;
const FILES_API = `${RENDER_BASE_URL}/api/files`; // Endpoint para descargar/previsualizar archivos
const LOGIN_URL = "./login.html"; 
const USER_PAGE_URL = 'file1.html';

// ⚙️ CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmV1Us7q_BeBHxUo'; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🌐 CONFIGURACIÓN APPWRITE
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '68ea7b28002bd7addb54';          
const APPWRITE_BUCKET_ID = '68ebd7b1000a707b10f2';  

// =======================================================
// 🔹 Variables del DOM (AJUSTADAS)
// =======================================================
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileListBody = document.getElementById('file-list-body');

const fileStatus = document.getElementById('file-status'); 
const filterStatus = document.getElementById('filter-status'); 

const filterCursoSelect = document.getElementById('filter-curso-select');
const filterSemanaSelect = document.getElementById('filter-semana-select');

const roleDisplay = document.getElementById('role-display');
const logoutBtn = document.getElementById('logout-btn');
const dynamicTitle = document.getElementById('dynamic-title');

const previewModalElement = document.getElementById('previewModal');
const previewModal = new bootstrap.Modal(previewModalElement, {}); 
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');
const previewFileNameSpan = document.getElementById('preview-filename');

let role = localStorage.getItem('role') || 'usuario';

// =======================================================
// 🔹 Funciones Utilitarias 
// =======================================================
function detectType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) return "document";
    return "other";
}

function setEstado(msg, targetElement = fileStatus, isError = false) {
    if (!targetElement) return;

    targetElement.textContent = msg;
    targetElement.classList.remove('d-none', 'text-danger', 'text-primary', 'text-info', 'text-success');
    targetElement.classList.add(isError ? 'text-danger' : 'text-info'); 
    targetElement.classList.remove('d-none');
}

function clearEstado(targetElement = fileStatus) {
    if (!targetElement) return;
    targetElement.textContent = '';
    targetElement.classList.add('d-none');
}

// =======================================================
// 🔹 Funciones de Acción de la Tabla (ligeros cambios en setEstado)
// =======================================================
function openPreview(fileName, fileId) {
    const type = detectType(fileName);
    previewContent.innerHTML = '';
    previewFileNameSpan.textContent = fileName;
    
    const internalUrl = `${FILES_API}/${fileId}`; 
    const appwriteBase = APPWRITE_ENDPOINT.replace('/v1', '');
    const appwriteResourceBase = `${appwriteBase}/v1/storage/buckets/${APPWRITE_BUCKET_ID}/files/${fileId}`;
    
    let embedUrl = '';
    let linkUrl = internalUrl;

    if (type === "image") {
        embedUrl = `${appwriteResourceBase}/preview?project=${APPWRITE_PROJECT_ID}&quality=80&width=800&height=600`;
        previewContent.innerHTML = `<img src="${embedUrl}" class="img-fluid mx-auto d-block" style="max-height: 80vh;">`;
        linkUrl = embedUrl; 
    
    } else if (type === "pdf" || type === "document") {
        
        const appwriteViewUrl = `${appwriteResourceBase}/view?project=${APPWRITE_PROJECT_ID}`;
        const encodedUrl = encodeURIComponent(appwriteViewUrl);
        linkUrl = appwriteViewUrl;
        
        if (type === "pdf") {
            embedUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
            
        } else if (type === "document") {
            embedUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`;
        }
        
        previewContent.innerHTML = `<iframe src="${embedUrl}" width="100%" height="600px" class="border-0" allowfullscreen></iframe>`;
        
        previewContent.innerHTML += `<p class="text-center text-muted p-4 small">
            Si la previsualización falla, haz clic en 
            <a href="${linkUrl}" target="_blank" class="text-decoration-underline">Abrir en nueva pestaña</a> 
            para iniciar la descarga.
        </p>`;

    } else {
        previewContent.innerHTML = `<p class="text-center text-muted p-4">
            No se puede previsualizar este tipo de archivo. Por favor, <button class="btn btn-link p-0 fw-bold btn-action btn-action-download text-decoration-underline" data-filename="${fileName}" data-file-id="${fileId}">descárgalo</button> para abrirlo.
        </p>`;
    }

    previewLink.href = linkUrl;
    previewModal.show();
}

async function handleDownload(fileName, fileId) {
    setEstado(`⏳ Descargando ${fileName}...`, filterStatus); 
    try {
        const url = `${FILES_API}/${fileId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        clearEstado(filterStatus); 
    } catch (err) {
        setEstado(`❌ Error al descargar: ${err.message}`, filterStatus, true); 
    }
}

async function handleDelete(recordId, fileName, fileId) { 
    if (!fileId) return setEstado("⚠️ Error interno: ID de archivo no encontrado.", filterStatus, true); 
    if (!confirm(`¿Eliminar "${fileName}"?`)) return;

    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida.", filterStatus, true);

    setEstado("⏳ Eliminando...", filterStatus); 

    try {
        const response = await fetch(`${BACKEND_API_WORKS}/${recordId}?fileId=${fileId}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }, 
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Fallo desconocido' }));
            throw new Error(errorData.error || response.statusText);
        }

        setEstado("🗑️ Archivo eliminado.", filterStatus); 
        cargarArchivos();
    } catch (err) {
        console.error("Error al eliminar:", err);
        setEstado(`❌ Error: ${err.message}`, filterStatus, true); 
    }
}

async function handleRename(recordId, oldFileName) {
    const newFileName = prompt(`Nuevo nombre para el archivo:`, oldFileName);
    if (!newFileName) return clearEstado(filterStatus); 
    if (newFileName.trim() === "") return setEstado("⚠️ El nuevo nombre no puede estar vacío.", filterStatus, true);

    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida.", filterStatus, true);
    
    try {
        setEstado("⏳ Renombrando...", filterStatus); 
        const response = await fetch(`${BACKEND_API_WORKS}/${recordId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({ nuevoNombre: newFileName }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Fallo desconocido' }));
            throw new Error(errorData.error || response.statusText);
        }
        
        setEstado("✅ Archivo renombrado.", filterStatus); 
        cargarArchivos(); 
    } catch (err) {
        console.error("Error al renombrar:", err);
        setEstado(`❌ Error: ${err.message}`, filterStatus, true); 
    }
}

// =======================================================
// 🔹 Cargar archivos (GET) - CON FILTRO AUTOMÁTICO 
// =======================================================
async function cargarArchivos() {
    if (!fileListBody) return;
    
    const cursoFiltro = filterCursoSelect ? filterCursoSelect.value : '';
    const semanaFiltro = filterSemanaSelect ? filterSemanaSelect.value : '';

    let url = BACKEND_API_WORKS;
    let params = [];

    if (cursoFiltro) params.push(`curso=${encodeURIComponent(cursoFiltro)}`);
    if (semanaFiltro) params.push(`semana=${encodeURIComponent(semanaFiltro)}`);

    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    setEstado("⏳ Buscando documentos...", filterStatus);
    
    fileListBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-secondary">Buscando documentos...</td></tr>`;
    
    let title = "Gestión de Archivos";
    if (cursoFiltro && semanaFiltro) {
        title = `Archivos: ${cursoFiltro} / ${semanaFiltro}`;
    } else if (cursoFiltro) {
        title = `Archivos de: ${cursoFiltro}`;
    } else if (semanaFiltro) {
        title = `Archivos de: ${semanaFiltro}`;
    }
    if (dynamicTitle) dynamicTitle.textContent = title;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const records = await response.json();
        fileListBody.innerHTML = ''; 

        if (records.length === 0) {
            fileListBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-info">No se encontraron archivos con ese filtro.</td></tr>`;
            clearEstado(filterStatus); 
            return;
        }

        records.forEach(record => renderFileRow(record));
        clearEstado(filterStatus);
    } catch (err) {
        console.error("❌ [ERROR CRÍTICO] Fallo general al cargar archivos:", err);
        const errorMessage = `❌ ERROR: ${err.message || "Fallo de red o servidor inactivo."}`;
        setEstado(errorMessage, filterStatus, true); 
        fileListBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-danger">${errorMessage}</td></tr>`;
    }
}

// =======================================================
// 🔹 Subir archivo (POST) 
// =======================================================
async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setEstado("⚠️ Selecciona un archivo.", fileStatus, true);

    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida.", fileStatus, true);

    const curso = filterCursoSelect ? filterCursoSelect.value : '';
    const semana = filterSemanaSelect ? filterSemanaSelect.value : '';
    
    if (curso === "" || curso === "Todos los Cursos" || semana === "" || semana === "Todas las Semanas") {
        return setEstado("⚠️ Debes seleccionar un Curso y una Semana específicos en el panel de Filtros para subir el archivo.", fileStatus, true);
    }

    setEstado("⏳ Subiendo archivo...", fileStatus);

    const formData = new FormData();
    formData.append('curso', curso);
    formData.append('semana', semana);
    formData.append('documento', file);

    try {
        const response = await fetch(BACKEND_API_WORKS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            setEstado("✅ Archivo subido con éxito", fileStatus);
            fileInput.value = ''; 
            cargarArchivos(); 
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Fallo desconocido' }));
            setEstado(`❌ Error al subir: ${errorData.error || response.statusText}`, fileStatus, true);
        }
    } catch (error) {
        console.error("❌ Error de red:", error);
        setEstado('❌ Error de red. Verifica Render.', fileStatus, true);
    }
}

// =======================================================
// 🔹 Render de tabla (MODIFICADO para botones en fila y nueva columna)
// =======================================================
function renderFileRow(record) {
    const recordId = record.$id || record.id;
    const fileId = record.fileId; 
    const fileName = record.fileName || "Archivo";
    const curso = record.curso || "N/A";
    const semana = record.semana || "N/A";

    const row = fileListBody.insertRow();
    row.className = ''; 

    // Celda de Nombre del Archivo
    const nameCell = row.insertCell();
    nameCell.className = 'py-3 px-4'; 
    nameCell.innerHTML = `
        <button class="btn btn-link p-0 btn-action btn-action-view text-decoration-none text-light fw-bold" data-filename="${fileName}" data-file-id="${fileId}">
            ${fileName}
        </button>
        <div class="file-id-text">${fileId ? 'ID: ' + fileId.substring(0, 8) + '...' : 'ID: N/A'}</div>
    `;
    
    // NUEVA CELDA: Curso / Semana
    const cursoSemanaCell = row.insertCell();
    cursoSemanaCell.className = 'py-3 px-4 text-muted small';
    cursoSemanaCell.textContent = `${curso} / ${semana}`;

    // Celda de Acciones (Botones en Fila)
    const actionsCell = row.insertCell();
    actionsCell.className = 'py-3 px-4 text-center'; 
    actionsCell.innerHTML = `
        <div class="d-flex gap-2 justify-content-center">
            <button class="btn btn-sm btn-action btn-action-view" data-filename="${fileName}" data-file-id="${fileId}">
                <i class="bi bi-eye"></i> Ver
            </button>
            <button class="btn btn-sm btn-action btn-action-download" data-filename="${fileName}" data-file-id="${fileId}">
                <i class="bi bi-download"></i> Descargar
            </button>
            <button class="btn btn-sm btn-action btn-action-edit" data-record-id="${recordId}" data-filename="${fileName}">
                <i class="bi bi-pencil"></i> Renombrar
            </button>
            <button class="btn btn-sm btn-action btn-action-delete" data-record-id="${recordId}" data-file-id="${fileId}" data-filename="${fileName}">
                <i class="bi bi-trash"></i> Borrar
            </button> 
        </div>
    `;
}

// =======================================================
// 🔹 Acciones y Vista Previa (Sin cambios)
// =======================================================
function handleActionClick(e) {
    const btn = e.target.closest('.btn-action'); 
    if (!btn) return;

    const fileName = btn.getAttribute('data-filename');
    const fileId = btn.getAttribute('data-file-id');
    const recordId = btn.getAttribute('data-record-id');

    if (btn.classList.contains('btn-action-view')) openPreview(fileName, fileId);
    if (btn.classList.contains('btn-action-download')) handleDownload(fileName, fileId); 
    if (btn.classList.contains('btn-action-delete')) handleDelete(recordId, fileName, fileId); 
    if (btn.classList.contains('btn-action-edit')) handleRename(recordId, fileName);
}


// =======================================================
// 🔹 Autenticación e Inicialización (FINAL)
// =======================================================
async function checkAuthAndInit() {
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    if (authError || !session) { 
        window.location.href = LOGIN_URL; 
        return; 
    }

    const userRole = localStorage.getItem('role') || 'usuario';
    if (userRole !== 'admin') { 
        window.location.href = USER_PAGE_URL; 
        return;
    }

    role = userRole; 
    if (roleDisplay) roleDisplay.textContent = role.toUpperCase();

    await cargarArchivos(); 

    if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
    document.addEventListener('click', handleActionClick); 
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    if (filterCursoSelect) filterCursoSelect.addEventListener('change', cargarArchivos);
    if (filterSemanaSelect) filterSemanaSelect.addEventListener('change', cargarArchivos);
}

async function handleLogout() {
    await supabaseClient.auth.signOut(); 
    localStorage.clear();
    window.location.href = LOGIN_URL; 
}

document.addEventListener('DOMContentLoaded', checkAuthAndInit);