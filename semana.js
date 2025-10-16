// ======================================================================
// semana.js - CÓDIGO FINAL CORREGIDO Y OPTIMIZADO
// ======================================================================

// 🌐 CONFIGURACIÓN BACKEND (Consistente con los otros archivos)
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`;
const FILES_API = `${RENDER_BASE_URL}/api/files`; // Endpoint para descargar/previsualizar

// 🌐 CONFIGURACIÓN APPWRITE (Necesaria para la previsualización avanzada)
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '68ea7b28002bd7addb54';         
const APPWRITE_BUCKET_ID = '68ebd7b1000a707b10f2';  

// =======================================================
// 🔹 Variables del DOM
// =======================================================
const backButton = document.getElementById('back-to-course-btn');
const courseNameDisplay = document.getElementById('course-name-display');
const weekNameDisplay = document.getElementById('week-name-display');
const fileStatus = document.getElementById('file-status');
const filesContainer = document.getElementById('files-container'); 

// Modal de Vista Previa
const previewModalElement = document.getElementById('previewModal');
const previewModal = new bootstrap.Modal(previewModalElement, {});
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');
const previewFileNameSpan = document.getElementById('preview-filename');

let currentCourse = null;
let currentWeek = null;

// =======================================================
// 🔹 Funciones Utilitarias (Reutilizadas de file1.js/file2.js)
// =======================================================
function setEstado(msg, isError = false) {
    if (!fileStatus) return;
    fileStatus.textContent = msg;
    fileStatus.className = 'alert fw-bold mt-3'; // Reset classes
    fileStatus.classList.add(isError ? 'alert-danger' : 'alert-info');
}

function clearEstado() {
    if (!fileStatus) return;
    fileStatus.textContent = '';
    fileStatus.classList.add('d-none');
}

function detectType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) return "document";
    if (["zip", "rar", "7z"].includes(ext)) return "archive";
    return "other";
}

function getTypeIcon(type) {
    switch (type) {
        case 'image': return 'fa-image';
        case 'pdf': return 'fa-file-pdf';
        case 'document': return 'fa-file-word'; 
        case 'archive': return 'fa-file-archive';
        default: return 'fa-file';
    }
}

// =======================================================
// 🔹 Lógica de Vista Previa y Descarga (ADAPTADA Y MEJORADA)
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
        embedUrl = `${appwriteResourceBase}/preview?project=${APPWRITE_PROJECT_ID}&quality=80&width=1200`;
        previewContent.innerHTML = `<img src="${embedUrl}" class="img-fluid mx-auto d-block" style="max-height: 80vh; object-fit: contain;">`;
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
        
        previewContent.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" class="border-0" allowfullscreen></iframe>`;
    } else {
        previewContent.innerHTML = `<div class="text-center p-5">
            <p class="text-white-50">No se puede previsualizar este tipo de archivo.</p>
            <button class="btn btn-primary btn-action-download-modal" data-filename="${fileName}" data-file-id="${fileId}">
                <i class="fa-solid fa-download me-2"></i>Descargar Archivo
            </button>
        </div>`;
    }

    previewLink.href = linkUrl;
    previewModal.show();
}

async function handleDownload(fileName, fileId) {
    setEstado(`⏳ Descargando ${fileName}...`); 
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
        clearEstado();
    } catch (err) {
        setEstado(`❌ Error al descargar: ${err.message}`, true); 
    }
}

// =======================================================
// 🔹 Carga y renderizado de archivos (FUNCIÓN CORREGIDA)
// =======================================================
function renderFileCard(record) {
    const fileId = record.fileId; 
    const fileName = record.fileName || "Archivo";
    const fileType = detectType(fileName);
    const fileIcon = getTypeIcon(fileType);
    
    const colDiv = document.createElement('div');
    colDiv.className = 'col';

    // ⭐ CORRECCIÓN: Siempre se muestra el ícono, nunca la imagen de vista previa.
    let previewHtml = `<i class="fa-solid ${fileIcon} icon-overlay"></i>`;
    
    colDiv.innerHTML = `
        <div class="file-card h-100">
            <div class="card-preview">
                ${previewHtml}
            </div>
            <div class="card-body p-3 d-flex flex-column">
                <h6 class="card-title text-white fw-bold mb-3 flex-grow-1">${fileName}</h6>
                <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mt-auto">
                    
                    <button class="btn btn-sm btn-magenta w-100 btn-action" data-action="view" data-filename="${fileName}" data-file-id="${fileId}">
                        <i class="fa-solid fa-eye me-1"></i> Ver
                    </button>
                    
                    <button class="btn btn-sm btn-outline-light w-100 btn-action" data-action="download" data-filename="${fileName}" data-file-id="${fileId}">
                        <i class="fa-solid fa-download me-1"></i> Descargar
                    </button>
                </div>
            </div>
        </div>`;
    filesContainer.appendChild(colDiv);
}

async function cargarArchivos() {
    filesContainer.innerHTML = '';
    
    if (!currentCourse || !currentWeek) {
        filesContainer.innerHTML = `<div class="col-12"><p class="text-center text-danger mt-5">⚠️ Faltan parámetros de curso o semana en la URL.</p></div>`;
        return;
    }
    
    setEstado(`⏳ Buscando archivos de ${currentWeek}...`);

    const url = `${BACKEND_API_WORKS}?curso=${encodeURIComponent(currentCourse)}&semana=${encodeURIComponent(currentWeek)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }
        
        const records = await response.json(); 

        if (records.length === 0) {
            filesContainer.innerHTML = `<div class="col-12"><p class="text-center text-white-50 mt-5">📭 No hay archivos disponibles para esta semana.</p></div>`;
            clearEstado();
            return;
        }
        
        records.forEach(renderFileCard);
        clearEstado();

    } catch (err) {
        console.error("Error al cargar archivos:", err);
        setEstado(`❌ Error de conexión: ${err.message}.`, true);
    }
}

function handleActionClick(e) {
    const button = e.target.closest('.btn-action');
    if (!button) return;
    
    const action = button.dataset.action;
    const fileName = button.dataset.filename; 
    const fileId = button.dataset.fileId; 

    if (action === 'view') {
        openPreview(fileName, fileId); 
    } else if (action === 'download') { 
        handleDownload(fileName, fileId);
    }
}

// =======================================================
// 🔹 Inicialización de la página
// =======================================================
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCourse = urlParams.get('course') ? decodeURIComponent(urlParams.get('course')) : null;
    currentWeek = urlParams.get('week') ? decodeURIComponent(urlParams.get('week')) : null;
    
    document.title = `${currentWeek || 'Semana'} de ${currentCourse || 'Curso'} - OMAR`;
    if (courseNameDisplay) courseNameDisplay.textContent = currentCourse || 'Curso';
    if (weekNameDisplay) weekNameDisplay.textContent = currentWeek || 'Semana';

    if (backButton && currentCourse) {
        backButton.href = `curso.html?name=${encodeURIComponent(currentCourse)}`;
    }

    document.addEventListener('click', handleActionClick);
    
    cargarArchivos();
}

document.addEventListener('DOMContentLoaded', init);