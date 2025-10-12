// =======================================================
// file2.js (ROL ADMIN) - MIGRADO A RENDER/APPWRITE (CRUD COMPLETO)
// =======================================================

// 🔑 Importar el cliente de Supabase para la AUTENTICACIÓN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

// 🛑🛑🛑 CONFIGURACIÓN DEL BACKEND MIGRADO 🛑🛑🛑
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`;
const LOGIN_URL = "./login.html"; 
const USER_PAGE_URL = 'file1.html';
// --------------------------------------------------------

// 🚨 CONFIGURACIÓN DE SUPABASE (MISMA QUE EN file1.js)
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmV1Us7q_BeBHxUo'; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);


// =================================================================
// 🔹 Variables de Estado (DOM Elements & Globals)
// =================================================================
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
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'), {});
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');
const previewFileNameSpan = document.getElementById('preview-filename'); 

// Asumimos que estos inputs existen para la subida
const tituloInput = document.getElementById('titulo'); 
const descripcionInput = document.getElementById('descripcion'); 

let role = localStorage.getItem('role') || 'usuario';
let urlCourse = null;
let urlWeek = null;


// =================================================================
// 🔹 Funciones de Utilidad (Mantenidas)
// =================================================================
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
    fileStatus.classList.toggle('text-pink-700', !isError); 
    fileStatus.classList.toggle('text-danger', isError); 
}

function clearEstado() {
    fileStatus.textContent = '';
    fileStatus.classList.add('d-none');
}

function getFileUrl(record) {
    // En Appwrite/Render, la URL viene en el registro
    return record.fileUrl; 
}


// =================================================================
// 🔹 Funciones de Autenticación (SUPABASE REAL)
// =================================================================

async function checkAuthAndInit() {
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError || !session) { 
        window.location.href = LOGIN_URL; 
        return; 
    }
    
    const userRole = localStorage.getItem('role') || 'usuario';

    // 3. Verificar Rol y Redirección (file2.html es solo para ADMIN)
    if (userRole !== 'admin') { 
        window.location.href = USER_PAGE_URL; 
        return;
    }
    
    // 4. Inicialización UI (Solo si el rol es 'admin')
    role = userRole; 
    if (roleDisplay) roleDisplay.textContent = role.toUpperCase();
    if (uploadControls) uploadControls.classList.remove('d-none'); 

    checkUrlParams(); 
    await cargarArchivos(); 

    // 5. Asignar Listeners
    if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
    document.addEventListener('click', handleActionClick); 
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (!urlCourse && !urlWeek) {
        if (cursoSelect) cursoSelect.addEventListener('change', cargarArchivos);
        if (semanaSelect) semanaSelect.addEventListener('change', cargarArchivos);
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut(); 
    localStorage.clear();
    window.location.href = LOGIN_URL; 
}


// =================================================================
// 🔹 RENDER/APPWRITE (CRUD: READ & FILTER) 🔹
// =================================================================

/**
 * 💥 MIGRADO: Lee todos y filtra en el Frontend (mismo método que file1.js).
 */
async function cargarArchivos() {
    if (!fileListBody) return;
    
    setEstado("⏳ Cargando y filtrando archivos...");
    
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');
    
    const shouldFilter = !!curso && !!semana && curso !== 'default' && semana !== 'default';

    fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-secondary font-semibold">Buscando documentos...</td></tr>`;

    try {
        const response = await fetch(BACKEND_API_WORKS, { method: 'GET' });

        if (!response.ok) {
             throw new Error(`Fallo la carga: ${response.statusText}`);
        }
        
        const records = await response.json(); 
        let filteredRecords = records;

        // 2. Filtrado en el Frontend 
        if (shouldFilter) {
            const cursoTerm = `[${curso.toLowerCase()}]`;
            const semanaTerm = `[${semana.toLowerCase()}]`;
            
            filteredRecords = records.filter(record => {
                const tituloLower = record.titulo ? record.titulo.toLowerCase() : '';
                return tituloLower.includes(cursoTerm) && tituloLower.includes(semanaTerm);
            });
        }
        
        fileListBody.innerHTML = ''; 

        if (filteredRecords.length === 0) {
            setEstado(`📭 Sin archivos disponibles para ${curso} - ${semana}`);
            fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos en este filtro.</td></tr>`;
            return;
        }
        
        // 3. Renderizar
        filteredRecords.forEach(record => {
            renderFileRow(record, curso, semana); 
        });

        clearEstado();

    } catch (err) {
        console.error("Error al cargar archivos (Render/Appwrite):", err);
        setEstado(`❌ Error al obtener archivos: ${err.message}.`, true);
    }
}


// =================================================================
// 🔹 RENDER/APPWRITE (CREATE) - SUBIR ARCHIVO 🔹
// =================================================================

/**
 * 💥 MIGRADO: Usa la misma lógica de subida que file1.js.
 */
async function handleUpload(e) {
    e.preventDefault();

    const file = fileInput.files[0];
    const titulo = tituloInput ? tituloInput.value : '';
    const descripcion = descripcionInput ? descripcionInput.value : '';
    const token = localStorage.getItem('token'); 

    if (!token) return setEstado("⚠️ Sesión no válida. Inicia sesión.", true);
    if (!file || !titulo) return setEstado("⚠️ Título y Archivo son requeridos.", true);
    
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');

    if (!curso || !semana || curso === 'default' || semana === 'default') {
         return setEstado("⚠️ Selecciona un curso y una semana válidos para subir el archivo.", true);
    }
    
    setEstado("⏳ Subiendo a Appwrite...");
    
    const formData = new FormData();
    formData.append('documento', file); 
    // 🔑 Título: Incluimos Curso/Semana para el filtrado en READ
    formData.append('titulo', `[${curso}] - [${semana}] - ${titulo}`);
    formData.append('descripcion', descripcion);

    try {
        const response = await fetch(BACKEND_API_WORKS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }, 
            body: formData,
        });

        if (response.ok) {
            setEstado("✅ Archivo subido con éxito");
            if (fileInput) fileInput.value = ''; 
            if (tituloInput) tituloInput.value = '';
            if (descripcionInput) descripcionInput.value = '';
            cargarArchivos(); 
        } else {
            const errorData = await response.json().catch(() => ({error: 'Fallo desconocido'}));
            setEstado(`❌ Error al subir: ${errorData.error || response.statusText}`, true);
        }
    } catch (error) {
        setEstado('❌ Error de red. Verifica que Render esté activo.', true);
    }
}


// =================================================================
// 🔹 RENDER/APPWRITE (DELETE) - ELIMINAR ARCHIVO 🔹
// =================================================================

/**
 * 💥 MIGRADO: Elimina el archivo y el registro usando un DELETE con ID.
 */
async function handleDelete(recordId, fileName) { 
    if (!confirm(`¿Estás seguro de que quieres ELIMINAR el archivo "${fileName}"? Esta acción es irreversible.`)) {
        return;
    }
    
    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida. Inicia sesión.", true);

    setEstado("⏳ Eliminando...");
    
    try {
        const response = await fetch(`${BACKEND_API_WORKS}/${recordId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }, 
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({error: 'Fallo desconocido'}));
            throw new Error(errorData.error || response.statusText);
        }

        setEstado("🗑️ Archivo eliminado correctamente");
        cargarArchivos(); // Recargar la lista
    } catch (err) {
        console.error("Error al eliminar (Render/Appwrite):", err);
        setEstado(`❌ Error al eliminar archivo: ${err.message}`, true);
    }
}


// =================================================================
// 🔹 RENDER/APPWRITE (UPDATE) - RENOMBRAR ARCHIVO 🔹
// =================================================================

/**
 * 💥 MIGRADO: Actualiza el campo 'titulo' usando un PUT con ID.
 */
async function handleRename(recordId, oldFileTitle) {
    
    // 1. Extraer el prefijo [Curso] - [Semana] - del título actual
    const titleRegex = /(\[.+?\]\s-\s\[.+?\]\s-\s)(.*)/;
    const match = oldFileTitle.match(titleRegex);
    
    // Si no tiene el formato esperado, tomamos todo el título como base
    const prefix = match ? match[1] : '';
    const baseName = match ? match[2] : oldFileTitle;
    
    const newBaseName = prompt(`Escribe el nuevo NOMBRE BASE del archivo:`, baseName.trim());
    
    if (!newBaseName || newBaseName.trim() === "") {
        setEstado("⚠️ Nombre no modificado.", true);
        return;
    }
    
    // 2. Reconstruir el nuevo título completo (con el prefijo)
    const newTitle = `${prefix}${newBaseName.trim()}`;
    const token = localStorage.getItem('token'); 
    if (!token) return setEstado("⚠️ Sesión no válida. Inicia sesión.", true);
    
    try {
        setEstado(`⏳ Renombrando "${oldFileTitle}" a "${newTitle}"...`);
        
        const response = await fetch(`${BACKEND_API_WORKS}/${recordId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' // Necesario para enviar JSON
            }, 
            body: JSON.stringify({ 
                titulo: newTitle // Actualizamos el título
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({error: 'Fallo desconocido'}));
            throw new Error(errorData.error || response.statusText);
        }
        
        setEstado("✅ Archivo renombrado con éxito.");
        cargarArchivos(); 
    } catch (err) {
        console.error("❌ Error al renombrar (Render/Appwrite):", err);
        setEstado(`❌ Error al renombrar archivo: ${err.message}`, true);
    }
}


// =======================================================
// file2.js (ROL ADMIN) - FUNCIÓN RENDER MODIFICADA
// =======================================================
function renderFileRow(record, curso, semana) {
    // 🔑 CLAVE: Usamos 'titulo' como nombre visible y 'id' como recordId
    const recordId = record.id; 
    const displayTitle = record.titulo; 
    const displayFileName = record.fileName; // Usamos este para la descarga y previsualización
    const fileUrl = getFileUrl(record); 
    
    const row = fileListBody.insertRow();
    row.className = 'border-t hover:bg-light transition';

    const nameCell = row.insertCell();
    // Usamos el título completo para la visualización en la tabla
    nameCell.className = 'py-3 px-4 text-sm text-primary font-medium break-words text-center';
    nameCell.innerHTML = `<button class="btn btn-link p-0 text-decoration-none w-100 text-center btn-action btn-action-view" data-filename="${displayFileName}" data-fileurl="${fileUrl}">${displayTitle}</button>`;

    const actionsCell = row.insertCell();
    actionsCell.className = 'py-3 px-4 text-center align-middle'; 

    actionsCell.innerHTML = `
        <div class="d-grid gap-2">
            
            <button class="btn btn-sm btn-primary w-100 btn-action btn-action-view" 
                data-filename="${displayFileName}" 
                data-fileurl="${fileUrl}">Ver</button>
            
            <button class="btn btn-sm btn-success w-100 btn-action-download" 
                data-filename-download="${displayFileName}" 
                data-fileurl="${fileUrl}" 
                title="Descargar">Descargar</button>
            
            <button class="btn btn-sm btn-warning w-100 btn-action btn-action-edit" 
                data-record-id="${recordId}" 
                data-filename="${displayTitle}">Editar</button>
            
            <button class="btn btn-sm btn-dark w-100 btn-action btn-action-delete" 
                data-record-id="${recordId}" 
                data-filename="${displayTitle}">Borrar</button>
        </div>
    `;
}


// =================================================================
// 🔹 Escucha de Acciones & Modal (Mantenidas, adaptadas a nuevos handlers)
// =================================================================

async function handleDownload(fileName, fileUrl) {
    setEstado(`⏳ Preparando descarga de ${fileName}...`);
    try {
        const response = await fetch(fileUrl); 
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}.`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        clearEstado();
    } catch (error) {
        setEstado(`❌ Error al descargar: ${error.message}`, true);
    }
}

function handleActionClick(e) {
    const button = e.target.closest('.btn-action');
    if (button) {
        const fileName = button.getAttribute('data-filename'); // Es el 'titulo' para editar/borrar
        const fileUrl = button.getAttribute('data-fileurl'); 
        const recordId = button.getAttribute('data-record-id');
        
        if (button.classList.contains('btn-action-view')) {
            openPreview(fileName, fileUrl); 
        } else if (button.classList.contains('btn-action-delete')) {
            handleDelete(recordId, fileName); 
        } else if (button.classList.contains('btn-action-edit')) { 
            handleRename(recordId, fileName); 
        }
    }
    
    const downloadButton = e.target.closest('.btn-action-download');
    if (downloadButton) {
        const fileNameDownload = downloadButton.getAttribute('data-filename-download'); // Es el 'fileName' para la descarga
        const fileUrlDownload = downloadButton.getAttribute('data-fileurl'); 
        handleDownload(fileNameDownload, fileUrlDownload);
    }
}

function openPreview(fileName, publicUrl) {
    const type = detectType(fileName);
    if (!publicUrl) return setEstado("⚠️ No se pudo obtener la URL del archivo", true);
    previewContent.innerHTML = ''; 
    if (previewFileNameSpan) previewFileNameSpan.textContent = fileName;
    previewLink.href = publicUrl;
    
    let contentHTML;
    if (type === "image") {
        contentHTML = `<div class="w-100 h-100 d-flex justify-content-center align-items-center"><img src="${publicUrl}" alt="${fileName}" class="img-fluid" style="max-height: 100%; max-width: 100%; object-fit: contain;"></div>`;
    } else if (type === "pdf" || type === "document") {
        let iframeSrc = publicUrl;
        if (type === "document") iframeSrc = `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;
        contentHTML = `
            <div class="w-100 h-100 d-flex flex-column">
                <iframe src="${iframeSrc}" title="Vista previa ${type}" class="w-100 border-0" style="flex-grow: 1; height: 100%;"></iframe>
                <div class="text-center p-2 bg-light w-100 flex-shrink-0 border-top"><small class="text-muted">Si la previsualización falla, use el botón "Abrir en nueva pestaña".</small></div>
            </div>`;
    } else {
        contentHTML = `<p class="text-center text-muted p-5">No se puede previsualizar este tipo de archivo.</p>`;
    }
    previewContent.innerHTML = contentHTML;
    previewModal.show();
}

// =================================================================
// 🔹 Funciones de Inicialización (Mantenidas)
// =================================================================
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const c = urlParams.get('c');
    const s = urlParams.get('s');

    if (c && s) { 
        urlCourse = c;
        urlWeek = s;
        if (cursoSelect) cursoSelect.style.display = 'none';
        if (semanaSelect) semanaSelect.style.display = 'none';
        if (uploadControls) uploadControls.classList.remove('d-none');
        if (dynamicTitle) dynamicTitle.textContent = `Documentos de ${c} - ${s}`;
    } else {
        if (uploadControls) uploadControls.classList.remove('d-none'); 
        if (dynamicTitle) dynamicTitle.textContent = "Selecciona un curso/semana";
        if (cursoSelect) cursoSelect.style.display = '';
        if (semanaSelect) semanaSelect.style.display = '';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInit();
});