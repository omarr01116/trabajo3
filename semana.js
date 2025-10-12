// =======================================================
// semana.js (Migrado a RENDER/APPWRITE - Lógica de Cards y Vista Previa)
// =======================================================

// 🛑🛑🛑 CONFIGURACIÓN DEL BACKEND MIGRADO 🛑🛑🛑
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`; 
// --------------------------------------------------------

// =================================================================
// 🔹 Variables de Estado (DOM Elements)
// =================================================================
// Títulos y control
const backButton = document.getElementById('back-to-course-btn');
const courseNameDisplay = document.getElementById('course-name-display');
const weekNameDisplay = document.getElementById('week-name-display');
const weekTitleShort = document.getElementById('week-title-short');
const fileStatus = document.getElementById('file-status');

// Contenedor para las cards
const filesContainer = document.getElementById('files-container'); 

// Elementos del Modal de Vista Previa
const previewModalElement = document.getElementById('previewModal');
const previewModal = previewModalElement ? new bootstrap.Modal(previewModalElement, {}) : null;
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');
const previewFileNameSpan = document.getElementById('preview-filename'); 

let currentCourse = null;
let currentWeek = null;

// =================================================================
// 🔹 Funciones de Utilidad y Estado
// =================================================================

function setEstado(msg, isError = false) {
    fileStatus.textContent = msg;
    fileStatus.classList.remove('d-none', 'alert-success', 'alert-danger');
    fileStatus.classList.add(isError ? 'alert-danger' : 'alert-success'); 
}

function clearEstado() {
    fileStatus.textContent = '';
    fileStatus.classList.add('d-none');
}

/**
 * 💥 MIGRADO: Retorna la URL del archivo desde el registro de Appwrite/Render.
 */
function getFileUrl(record) {
    return record.fileUrl; 
}

/**
 * Detecta el tipo de archivo para la vista previa y el ícono.
 * NOTA: Usa el nombre del archivo (record.fileName) para detectar el tipo.
 */
function detectType(name) {
    if (!name) return "other";
    const ext = name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "document";
    if (["zip", "rar", "7z"].includes(ext)) return "archive";
    if (["mp4", "webm", "ogg"].includes(ext)) return "video";
    return "other";
}

/**
 * Retorna el ícono de Font Awesome basado en el tipo de archivo.
 */
function getTypeIcon(type) {
    switch (type) {
        case 'image': return 'fa-image';
        case 'pdf': return 'fa-file-pdf';
        case 'document': return 'fa-file-word'; 
        case 'archive': return 'fa-file-archive';
        case 'video': return 'fa-file-video';
        default: return 'fa-file';
    }
}

// =================================================================
// 🔹 LÓGICA DE VISTA PREVIA Y DESCARGA (Mantenida)
// =================================================================

function openPreview(fileName, publicUrl) {
    if (!previewModal) return setEstado("Error interno: Modal no encontrado.", true);
    
    const type = detectType(fileName);

    if (!publicUrl) return setEstado("⚠️ No se pudo obtener la URL del archivo", true);

    previewContent.innerHTML = ''; 
    previewFileNameSpan.textContent = fileName;
    previewLink.href = publicUrl;
    
    let contentHTML;
    
    if (type === "image") {
        contentHTML = `<div class="w-100 h-100 d-flex justify-content-center align-items-center">
            <img src="${publicUrl}" alt="${fileName}" class="img-fluid" style="max-height: 100%; max-width: 100%; object-fit: contain;">
        </div>`;
    } else if (type === "pdf" || type === "document") {
        let iframeSrc = publicUrl;
        if (type === "document") {
             iframeSrc = `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;
        }
        
        contentHTML = `
            <div class="w-100 h-100 d-flex flex-column">
                <iframe src="${iframeSrc}" title="Vista previa ${type}" class="w-100 border-0" style="flex-grow: 1; height: 100%;"></iframe>
                <div class="text-center p-2 bg-secondary w-100 flex-shrink-0 border-top">
                    <small class="text-white-50">Si la previsualización falla, use el botón "Abrir en nueva pestaña" o descargue.</small>
                </div>
            </div>`;
    } else {
        contentHTML = `<p class="text-center text-white-50 p-5">No se puede previsualizar este tipo de archivo directamente.</p>`;
    }
    
    previewContent.innerHTML = contentHTML;
    previewModal.show();
}

async function handleDownload(fileName, fileUrl) {
    setEstado(`⏳ Preparando descarga de ${fileName}...`);
    try {
        // La descarga funciona igual, solo que la URL ahora viene de Appwrite
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
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
        console.error("Error en la descarga:", error);
        setEstado(`❌ Error al descargar: ${error.message}`, true);
    }
}

// =================================================================
// 🔹 LÓGICA DE CARDS Y RENDER/APPWRITE READ
// =================================================================

/**
 * Renderiza la tarjeta (Card) del archivo.
 * 💥 MIGRADO: Usa 'record.titulo' como nombre visible y 'record.fileName' para el ícono.
 */
function renderFileCard(record) {
    // CLAVE: 'titulo' contiene el nombre que el usuario ve/editó.
    const displayTitle = record.titulo;
    // CLAVE: 'fileName' contiene la extensión original (ej. 'reporte.pdf').
    const displayFileName = record.fileName; 
    
    const fileUrl = getFileUrl(record); 
    const fileType = detectType(displayFileName); // Usamos el nombre del archivo original para la extensión
    const fileIcon = getTypeIcon(fileType);
    
    const colDiv = document.createElement('div');
    colDiv.className = 'col';

    let previewHtml = '';
    
    // Lógica para la imagen de referencia (miniatura o ícono)
    if (fileType === 'image') {
        previewHtml = `<img src="${fileUrl}" alt="${displayFileName}" class="card-img-top">`;
    } else {
        previewHtml = `<i class="fa-solid ${fileIcon} icon-overlay"></i>`; 
    }
    
    colDiv.innerHTML = `
        <div class="file-card">
            <div class="card-preview p-3">
                ${previewHtml}
            </div>
            <div class="card-body p-3 flex-grow-1 d-flex flex-column justify-content-between">
                <h6 class="card-title text-white fw-bold mb-3">${displayTitle}</h6>
                <div class="d-flex justify-content-between gap-2 mt-auto">
                    <button class="btn btn-sm btn-magenta w-100 btn-action btn-action-view" 
                        data-filename="${displayFileName}" 
                        data-fileurl="${fileUrl}">Ver</button>
                    
                    <button class="btn btn-sm btn-outline-light w-100 btn-action btn-action-download" 
                        data-filename="${displayFileName}" 
                        data-fileurl="${fileUrl}">Descargar</button>
                </div>
            </div>
        </div>
    `;

    filesContainer.appendChild(colDiv);
}

/**
 * 💥 MIGRADO: Carga todos los registros y filtra en el frontend.
 */
async function cargarArchivos() {
    filesContainer.innerHTML = '';
    
    if (currentCourse === 'Curso Desconocido' || currentWeek === 'Semana Desconocida') {
        filesContainer.innerHTML = `<div class="col-12"><p class="text-center text-danger mt-5">⚠️ No se pudo cargar el curso o la semana. Revise la URL.</p></div>`;
        return setEstado("⚠️ No se pudo cargar el curso o la semana. Revise la URL.", true);
    }
    
    setEstado(`⏳ Buscando archivos de ${currentWeek} para el curso ${currentCourse}...`);
    
    try {
        // 1. Obtener todos los registros de Render
        const response = await fetch(BACKEND_API_WORKS, { method: 'GET' });

        if (!response.ok) {
             throw new Error(`Fallo la carga: ${response.statusText}`);
        }
        
        const records = await response.json(); 
        let filteredRecords = records;

        // 2. Filtrado en el Frontend (buscando [curso] y [semana] en el título)
        const cursoTerm = `[${currentCourse.toLowerCase()}]`;
        const semanaTerm = `[${currentWeek.toLowerCase()}]`;
        
        filteredRecords = records.filter(record => {
            const tituloLower = record.titulo ? record.titulo.toLowerCase() : '';
            return tituloLower.includes(cursoTerm) && tituloLower.includes(semanaTerm);
        });

        if (filteredRecords.length === 0) {
            filesContainer.innerHTML = `<div class="col-12"><p class="text-center text-white-50 mt-5">📭 No hay archivos disponibles para esta semana.</p></div>`;
            return setEstado(`📭 No hay archivos disponibles para esta semana.`, false);
        }
        
        filteredRecords.forEach(renderFileCard);
        clearEstado();

    } catch (err) {
        console.error("Error al cargar archivos (Render/Appwrite):", err);
        setEstado(`❌ Error de conexión/lectura: ${err.message}.`, true);
    }
}

/**
 * Maneja todos los clics en los botones de acción (Ver y Descargar).
 */
function handleActionClick(e) {
    const button = e.target.closest('.btn-action');
    if (!button) return;
    
    // CLAVE: Para Descargar/Ver usamos el nombre del archivo con extensión (record.fileName)
    const fileName = button.getAttribute('data-filename'); 
    const fileUrl = button.getAttribute('data-fileurl'); 

    if (button.classList.contains('btn-action-view')) {
        openPreview(fileName, fileUrl); 
    } else if (button.classList.contains('btn-action-download')) { 
        handleDownload(fileName, fileUrl);
    }
}


// =================================================================
// 🔹 INICIALIZACIÓN (Mantenida)
// =================================================================
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const week = urlParams.get('week');

    // 1. Decodificar los parámetros de la URL
    currentCourse = course ? decodeURIComponent(course.replace(/\+/g, ' ')) : 'Curso Desconocido';
    currentWeek = week ? decodeURIComponent(week.replace(/\+/g, ' ')) : 'Semana Desconocida';
    
    // 2. ACTUALIZAR TÍTULOS EN EL HTML
    if (courseNameDisplay) courseNameDisplay.textContent = currentCourse;
    if (weekNameDisplay) weekNameDisplay.textContent = currentWeek;
    if (weekTitleShort) weekTitleShort.textContent = currentWeek;
    document.title = `${currentWeek} de ${currentCourse} - OMAR`;

    // 3. CONFIGURAR EL BOTÓN DE VOLVER A CURSO.HTML
    const encodedCourse = encodeURIComponent(currentCourse);
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = `curso.html?name=${encodedCourse}`; 
        });
    }

    // 4. Configurar listener de clics para el modal/descarga
    document.addEventListener('click', handleActionClick);
    
    // 5. Cargar archivos
    cargarArchivos();
}

document.addEventListener('DOMContentLoaded', init);