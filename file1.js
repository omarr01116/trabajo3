// =======================================================
// file1.js (ROL USUARIO) - MIGRADO A RENDER/APPWRITE (Sube, Ve, Descarga)
// =======================================================

// 🔑 Importar el cliente de Supabase para la AUTENTICACIÓN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

// 🛑🛑🛑 CONFIGURACIÓN DEL BACKEND MIGRADO 🛑🛑🛑
// URL base de tu servicio en Render
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`;
const LOGIN_URL = "./login.html"; 
const ADMIN_PAGE_URL = 'file2.html'; 
// --------------------------------------------------------

// 🚨 CONFIGURACIÓN DE SUPABASE (PARA AUTH) 🚨
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo'; 
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

    // 🛑 REDIRECCIÓN DEL ADMIN (Comentada para permitirle el acceso si es necesario)
    /*
    if (userRole === 'admin') { 
        window.location.href = ADMIN_PAGE_URL; 
        return;
    }
    */
    
    if (userRole === 'invitado') {
        window.location.href = './portafolio.html'; 
        return;
    }
    
    // Inicialización UI
    role = userRole; 
    if (roleDisplay) roleDisplay.textContent = role.toUpperCase();
    if (uploadControls) uploadControls.classList.remove('d-none'); 

    checkUrlParams(); 
    await cargarArchivos(); 

    // Asignar Listeners
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
// 🔹 RENDER/APPWRITE (CREATE) - SUBIR ARCHIVO 🔹
// =================================================================

/**
 * 💥 MIGRADO DE PocketBase a RENDER/APPWRITE
 * Los campos 'categoria' y 'subcategoria' de PocketBase se incrustan en 'titulo'.
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
    // 🛑 CLAVE: El nombre del campo DEBE SER 'documento'
    formData.append('documento', file); 
    // 🔑 Mapeamos los campos 'curso'/'semana' en el título para el FILTRADO en READ
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
        console.error('Error de red o de servidor:', error);
        setEstado('❌ Error de red. Verifica que Render esté activo.', true);
    }
}


// =================================================================
// 🔹 RENDER/APPWRITE (CRUD: READ & FILTER) 🔹
// =================================================================

/**
 * 💥 MIGRADO DE PocketBase a RENDER/APPWRITE. 
 * El filtro se realiza en el frontend buscando los términos [curso] y [semana] en el título.
 */
async function cargarArchivos() {
    if (!fileListBody) return;
    
    setEstado("⏳ Cargando y filtrando archivos...");
    
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');
    
    const shouldFilter = !!curso && !!semana && curso !== 'default' && semana !== 'default';

    fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">Buscando documentos...</td></tr>`;

    try {
        // 1. Obtener la lista COMPLETA de Appwrite/Render
        const response = await fetch(BACKEND_API_WORKS, { method: 'GET' });

        if (!response.ok) {
             throw new Error(`Fallo la carga: ${response.statusText}`);
        }
        
        const records = await response.json(); 
        let filteredRecords = records;

        // 2. Filtrado en el Frontend (Simulando el filtro de PocketBase)
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
            fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos en este filtro.</td></tr>`;
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

/**
 * Simplificada: La URL pública viene directamente en el objeto de Appwrite/Render.
 */
function getFileUrl(record) {
    return record.fileUrl; 
}


// =======================================================
// FUNCIÓN RENDER MODIFICADA
// =======================================================
function renderFileRow(record, curso, semana) {
    // Usamos 'fileName' para la descarga y 'titulo' para la visualización
    const displayFileName = record.fileName || record.titulo; 
    const fileUrl = getFileUrl(record); 
    
    // El 'titulo' es el campo que contiene Curso/Semana
    const fullPath = `${record.titulo}`; 

    const row = fileListBody.insertRow();
    row.className = 'border-t hover:bg-light transition';

    const nameCell = row.insertCell();
    nameCell.className = 'py-3 px-4 text-sm text-primary font-medium break-words'; 
    nameCell.innerHTML = `<button class="btn btn-link p-0 text-decoration-none text-start btn-action btn-action-view" data-filename="${displayFileName}" data-fileurl="${fileUrl}">${fullPath}</button>`;

    const actionsCell = row.insertCell();
    actionsCell.className = 'py-3 px-4 align-middle'; 
    
    actionsCell.innerHTML = `
        <div class="d-inline-flex justify-content-center btn-group-actions">
            <button class="btn btn-sm btn-primary rounded-pill font-medium btn-action btn-action-view" 
                data-filename="${displayFileName}" data-fileurl="${fileUrl}">Ver</button>
            
            <button class="btn btn-sm btn-success rounded-pill font-medium btn-action-download" 
                data-filename-download="${displayFileName}" 
                data-fileurl="${fileUrl}" 
                title="Descargar">Descargar</button>
        </div>
    `;
}


// =================================================================
// 🔹 LÓGICA DE DESCARGA FORZADA (Mantenida) y UI
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
    const viewButton = e.target.closest('.btn-action-view');
    if (viewButton) {
        const fileName = viewButton.getAttribute('data-filename'); 
        const fileUrl = viewButton.getAttribute('data-fileurl'); 
        openPreview(fileName, fileUrl); 
    } 
    const downloadButton = e.target.closest('.btn-action-download');
    if (downloadButton) {
        const fileNameDownload = downloadButton.getAttribute('data-filename-download'); 
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