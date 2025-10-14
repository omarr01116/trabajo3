// ======================================================================
// file2.js (ROL ADMIN) - CÓDIGO FINAL CORREGIDO
// ======================================================================

// 🔑 Cliente Supabase (solo para autenticación)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

// 🌐 CONFIGURACIÓN BACKEND
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`;
const LOGIN_URL = "./login.html"; 
const USER_PAGE_URL = 'file1.html';

// ⚙️ CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmV1Us7q_BeBHxUo'; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================================================
// 🔹 Variables del DOM
// =======================================================
const uploadForm = document.getElementById('upload-form');
const uploadControls = document.getElementById('upload-controls');
const cursoSelect = document.getElementById('curso-select');
const semanaSelect = document.getElementById('semana-select');
const fileInput = document.getElementById('file-input');
const fileListBody = document.getElementById('file-list-body');
const fileStatus = document.getElementById('file-status');
const roleDisplay = document.getElementById('role-display');
const logoutBtn = document.getElementById('logout-btn');
const dynamicTitle = document.getElementById('dynamic-title');
// Asegúrate de que bootstrap esté cargado para que esto funcione
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'), {}); 
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');
const previewFileNameSpan = document.getElementById('preview-filename'); 

let role = localStorage.getItem('role') || 'usuario';
let urlCourse = null;
let urlWeek = null;

// =======================================================
// 🔹 Funciones Utilitarias (DEBEN IR PRIMERO)
// =======================================================
function detectType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) return "document";
    return "other";
}

function setEstado(msg, isError = false) {
    fileStatus.textContent = msg;
    fileStatus.classList.remove('d-none');
    fileStatus.classList.toggle('text-danger', isError); 
}

function clearEstado() {
    fileStatus.textContent = '';
    fileStatus.classList.add('d-none');
}

// =======================================================
// 🔹 Funciones de Acción de la Tabla (DEBEN IR ANTES DE handleActionClick)
// =======================================================

function openPreview(fileName, url) {
    const type = detectType(fileName);
    previewContent.innerHTML = '';
    previewFileNameSpan.textContent = fileName;
    previewLink.href = url;

    if (type === "image") {
        previewContent.innerHTML = `<img src="${url}" class="img-fluid d-block mx-auto" style="max-height: 80vh;">`;
    } else if (type === "pdf") {
        previewContent.innerHTML = `<iframe src="${url}" width="100%" height="600px" class="border-0"></iframe>`;
    } else {
        previewContent.innerHTML = `<p class="text-center text-muted p-4">No se puede previsualizar este tipo de archivo.</p>`;
    }

    previewModal.show();
}

async function handleDownload(fileName, fileUrl) {
    setEstado(`⏳ Descargando ${fileName}...`);
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        clearEstado();
    } catch (err) {
        setEstado(`❌ Error al descargar: ${err.message}`, true);
    }
}


// =======================================================
// 🔹 Eliminar archivo (DELETE)
// =======================================================
// Se corrigió para recibir fileId
async function handleDelete(recordId, fileName, fileId) { 
    if (!fileId) return setEstado("⚠️ Error interno: ID de archivo no encontrado.", true);
    if (!confirm(`¿Eliminar "${fileName}"?`)) return;
    
    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida.", true);

    setEstado("⏳ Eliminando...");
    
    try {
        // El backend espera el fileId como query parameter: /api/works/:recordId?fileId=...
        const response = await fetch(`${BACKEND_API_WORKS}/${recordId}?fileId=${fileId}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }, 
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Fallo desconocido' }));
            throw new Error(errorData.error || response.statusText);
        }

        setEstado("🗑️ Archivo eliminado.");
        cargarArchivos();
    } catch (err) {
        console.error("Error al eliminar:", err);
        setEstado(`❌ Error: ${err.message}`, true);
    }
}

// =======================================================
// 🔹 Renombrar archivo (PUT)
// =======================================================
async function handleRename(recordId, oldFileName) {
    const newFileName = prompt(`Nuevo nombre para el archivo:`, oldFileName);
    if (!newFileName) return setEstado("⚠️ No se cambió el nombre.", true);

    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida.", true);
    
    try {
        setEstado("⏳ Renombrando...");
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
        
        setEstado("✅ Archivo renombrado.");
        cargarArchivos(); 
    } catch (err) {
        console.error("Error al renombrar:", err);
        setEstado(`❌ Error: ${err.message}`, true);
    }
}


// =======================================================
// 🔹 Autenticación con Supabase
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
    if (uploadControls) uploadControls.classList.remove('d-none'); 

    checkUrlParams(); 
    await cargarArchivos(); 

    if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
    // ⭐ La detección de clics en la tabla ahora funciona porque las funciones están definidas antes
    document.addEventListener('click', handleActionClick); 
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

async function handleLogout() {
    await supabaseClient.auth.signOut(); 
    localStorage.clear();
    window.location.href = LOGIN_URL; 
}


// =======================================================
// 🔹 Cargar archivos (GET) - IMPLEMENTACIÓN DE DEBUG
// =======================================================
async function cargarArchivos() {
    if (!fileListBody) return;
    
    setEstado("⏳ Conectando y buscando documentos...");

    fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-secondary font-semibold">Buscando documentos...</td></tr>`;

    try {
        console.log("🔍 [DEBUG] Iniciando solicitud GET a:", BACKEND_API_WORKS);
        
        const response = await fetch(BACKEND_API_WORKS);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`🚨 [ERROR] El servidor respondió con ${response.status}. Cuerpo del error:`, errorBody);
            throw new Error(`Error HTTP ${response.status}. Detalle del Servidor: ${errorBody.substring(0, 100)}...`);
        }
        
        const records = await response.json();
        console.log("✅ [DEBUG] Respuesta exitosa recibida. Total de documentos:", records.length);

        fileListBody.innerHTML = ''; 

        if (records.length === 0) {
            fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-secondary">Aún no hay archivos subidos.</td></tr>`;
            clearEstado(); 
            return;
        }

        records.forEach(record => renderFileRow(record));
        clearEstado();
        
    } catch (err) {
        console.error("❌ [ERROR CRÍTICO] Fallo general al cargar archivos:", err);
        
        const errorMessage = `❌ ERROR: ${err.message || "Fallo de red o servidor inactivo."}`;

        setEstado(errorMessage, true); 
        
        fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">${errorMessage}</td></tr>`;
    }
}
// =======================================================
// 🔹 Subir archivo (POST)
// =======================================================
async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setEstado("⚠️ Selecciona un archivo.", true);

    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida.", true);

    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');
    if (!curso || !semana || curso === 'default' || semana === 'default') {
        return setEstado("⚠️ Selecciona curso y semana válidos.", true);
    }

    setEstado("⏳ Subiendo archivo...");

    // ✅ Campos correctos según el backend
    const formData = new FormData();
    formData.append('curso', curso);
    formData.append('semana', semana);
    formData.append('documento', file);

    console.log("📦 Enviando FormData:", [...formData.entries()]);

    try {
        const response = await fetch(BACKEND_API_WORKS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (response.ok) {
            setEstado("✅ Archivo subido con éxito");
            fileInput.value = ''; 
            cargarArchivos(); 
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Fallo desconocido' }));
            setEstado(`❌ Error al subir: ${errorData.error || response.statusText}`, true);
        }
    } catch (error) {
        console.error("❌ Error de red:", error);
        setEstado('❌ Error de red. Verifica Render.', true);
    }
}


// =======================================================
// 🔹 Render de tabla
// =======================================================
function renderFileRow(record) {
    const recordId = record.$id || record.id;
    const fileId = record.fileId; 
    const fileUrl = record.fileUrl;
    const fileName = record.fileName || "Archivo";

    const row = fileListBody.insertRow();
    row.className = 'border-t hover:bg-light';

    const nameCell = row.insertCell();
    nameCell.className = 'py-3 px-4'; 
    nameCell.innerHTML = `
        <button class="btn btn-link p-0 btn-action btn-action-view text-decoration-none" data-filename="${fileName}" data-fileurl="${fileUrl}">
            ${fileName}
        </button>
    `;

    const actionsCell = row.insertCell();
    actionsCell.className = 'py-3 px-4 text-center'; 
    actionsCell.innerHTML = `
        <div class="d-grid gap-2">
            <button class="btn btn-sm btn-primary btn-action btn-action-view" data-filename="${fileName}" data-fileurl="${fileUrl}">Ver</button>
            <button class="btn btn-sm btn-success btn-action btn-action-download" data-filename="${fileName}" data-fileurl="${fileUrl}">Descargar</button>
            <button class="btn btn-sm btn-warning btn-action btn-action-edit" data-record-id="${recordId}" data-filename="${fileName}">Editar</button>
            <button class="btn btn-sm btn-dark btn-action btn-action-delete" data-record-id="${recordId}" data-file-id="${fileId}" data-filename="${fileName}">Borrar</button> 
        </div>
    `;
}

// =======================================================
// 🔹 Acciones y Vista Previa
// =======================================================
function handleActionClick(e) {
    const btn = e.target.closest('.btn-action'); 
    if (!btn) return;

    const fileName = btn.getAttribute('data-filename');
    const fileUrl = btn.getAttribute('data-fileurl');
    const recordId = btn.getAttribute('data-record-id');
    const fileId = btn.getAttribute('data-file-id');

    if (btn.classList.contains('btn-action-view')) {
        openPreview(fileName, fileUrl);
    } 
    
    if (btn.classList.contains('btn-action-download')) {
        handleDownload(fileName, fileUrl); 
    }
    
    if (btn.classList.contains('btn-action-delete')) {
        handleDelete(recordId, fileName, fileId); 
    }
    
    if (btn.classList.contains('btn-action-edit')) {
        handleRename(recordId, fileName);
    }
}


// =======================================================
// 🔹 Inicialización
// =======================================================
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    const s = params.get('s');

    if (c && s) {
        urlCourse = c;
        urlWeek = s;
        if (dynamicTitle) dynamicTitle.textContent = `${c} - ${s}`;
    } else {
        if (dynamicTitle) dynamicTitle.textContent = "Selecciona un curso/semana";
    }
}

document.addEventListener('DOMContentLoaded', checkAuthAndInit);