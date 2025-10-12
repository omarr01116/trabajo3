// =======================================================
// file2.js (ROL ADMIN) - CON PocketBase (Archivos) - SOLUCIÓN DESCARGA FORZADA
// =======================================================

import pb from './backend/pocketbaseClient.js'; 
// 🔑 Importar el cliente de Supabase para la AUTENTICACIÓN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

const FILE_COLLECTION = 'documentos_del_proyecto';
const LOGIN_URL = "./login.html"; 

// 🚨 CONFIGURACIÓN DE SUPABASE (DEBE SER LA MISMA QUE EN login.js)
// ⚠️ REEMPLAZA CON TUS VALORES REALES
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

let role = localStorage.getItem('role') || 'usuario';
const USER_PAGE_URL = 'file1.html'; // Redirigir si no es Admin

let urlCourse = null;
let urlWeek = null;

// =================================================================
// 🔹 Funciones de Utilidad (Idénticas a file1.js)
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
// 🔹 Funciones de Autenticación (Supabase Real)
// =================================================================

/**
 * ✅ SUPABASE REAL: Verifica la sesión, rol y realiza la redirección.
 */
async function checkAuthAndInit() {
    
    // 1. Verificar Sesión (REAL usando Supabase)
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError || !session) { 
        console.log("⚠️ Sesión no encontrada o error. Redirigiendo a login...");
        window.location.href = LOGIN_URL; 
        return; 
    }
    
    // 2. Obtener Rol (Usamos localStorage como fuente de verdad)
    const userRole = localStorage.getItem('role') || 'usuario';

    // 3. Verificar Rol y Redirección (file2.html es solo para ADMIN)
    if (userRole !== 'admin') { 
        console.log(`⚠️ Rol detectado: ${userRole}. Redirigiendo a página de Usuario.`);
        window.location.href = USER_PAGE_URL; 
        return;
    }
    
    // 4. Inicialización UI (Solo si el rol es 'admin')
    role = userRole; 
    if (roleDisplay) roleDisplay.textContent = role.toUpperCase();

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


/**
 * ✅ SUPABASE REAL: Cerrar sesión.
 */
async function handleLogout() {
    await supabaseClient.auth.signOut(); // Llamada real a Supabase
    localStorage.clear();
    window.location.href = LOGIN_URL; 
}


// =================================================================
// 🔹 Funciones de PocketBase (CRUD COMPLETO)
// =================================================================

/**
 * POCKETBASE (READ) - Carga los archivos filtrados por categoría/subcategoría.
 */
async function cargarArchivos() {
    if (!fileListBody) return;
    
    setEstado("⏳ Cargando archivos...");
    
    const curso = urlCourse || cursoSelect.value;
    const semana = urlWeek || semanaSelect.value;
    
    // DEBUG: console.log(`DEBUG: Filtro PocketBase: categoria="${curso}" && subcategoria="${semana}"`);

    const filter = `categoria="${curso}" && subcategoria="${semana}"`;
    
    fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-secondary font-semibold">Buscando ${curso} - ${semana}...</td></tr>`;

    try {
        const result = await pb.collection(FILE_COLLECTION).getList(1, 50, { 
            filter: filter,
            sort: '-created'
        });

        // DEBUG: console.log(`DEBUG: Registros encontrados: ${result.items.length}`);
        fileListBody.innerHTML = ''; 

        if (result.items.length === 0) {
            setEstado(`📭 Sin archivos en ${curso} - ${semana}`);
            fileListBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos en este curso/semana</td></tr>`;
            return;
        }
        
        result.items.forEach(record => {
            renderFileRow(record, curso, semana);
        });

        clearEstado();

    } catch (err) {
        console.error("Error al cargar archivos (PocketBase List):", err);
        // El mensaje de error se mostrará en el frontend por la función setEstado
        setEstado(`❌ Error al obtener archivos: ${err.message}. Revisa tus API Rules de SELECT.`, true);
    }
}

/**
 * POCKETBASE (CREATE) - Sube un archivo. (Idéntica a file1.js)
 */
async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setEstado("⚠️ Selecciona un archivo primero", true);
    
    setEstado("⏳ Subiendo...");
    
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');

    if (!curso || !semana) return setEstado("⚠️ Selecciona un curso y una semana válidos.", true);

    const formData = new FormData();
    formData.append('categoria', curso); 
    formData.append('subcategoria', semana);
    formData.append('archivo_digital', file); 
    
    // Inicializamos nombre_visible con el nombre original del archivo.
    formData.append('nombre_visible', file.name);

    try {
        await pb.collection(FILE_COLLECTION).create(formData);
        
        setEstado("✅ Archivo subido con éxito");
        if (fileInput) fileInput.value = ''; 
        cargarArchivos();
    } catch (err) {
        console.error("Error al subir archivo (PocketBase Create):", err);
        setEstado("❌ Error al subir archivo: " + (err.message || "Error desconocido"), true);
    }
}


/**
 * POCKETBASE (DELETE) - Elimina un registro de la colección (y el archivo asociado).
 */
async function handleDelete(recordId, fileName) { 
    if (!confirm(`¿Estás seguro de que quieres ELIMINAR el archivo "${fileName}"? Esta acción es irreversible.`)) {
        return;
    }

    setEstado("⏳ Eliminando...");
    
    try {
        await pb.collection(FILE_COLLECTION).delete(recordId);

        setEstado("🗑️ Archivo eliminado correctamente");
        cargarArchivos(); // Recargar la lista
    } catch (err) {
        console.error("Error al eliminar (PocketBase Delete):", err);
        setEstado(`❌ Error al eliminar archivo: ${err.message}. Revisa tus API Rules de DELETE.`, true);
    }
}


/**
 * POCKETBASE (FILE URL) - Genera la URL para ver/descargar el archivo.
 */
function getFileUrl(record) {
    return pb.getFileUrl(record, record.archivo_digital, { /* Opciones */ });
}

/**
 * POCKETBASE (RENAME) - Cambia el nombre visible del archivo.
 */
async function handleRename(recordId, oldFileNameWithExt) {
    const parts = oldFileNameWithExt.split('.');
    const ext = parts.length > 1 && parts[parts.length - 1].length > 0 ? '.' + parts.pop() : ''; 
    const baseName = parts.join('.'); // Nombre base sin la extensión

    const newBaseName = prompt(`Escribe el nuevo nombre para "${oldFileNameWithExt}" (sin la extensión):`, baseName);
    
    // Si el usuario cancela o deja vacío
    if (!newBaseName || newBaseName.trim() === "") {
        setEstado("⚠️ Nombre no modificado.", true);
        return;
    }

    const newNameTrimmed = newBaseName.trim();
    // ✅ CLAVE: Reconstruir el nuevo nombre visible con la extensión
    const newFileNameWithExt = `${newNameTrimmed}${ext}`; 

    try {
        setEstado(`⏳ Renombrando "${oldFileNameWithExt}" a "${newFileNameWithExt}"...`);
        
        // 🚨 DIAGNÓSTICO DE ROL: Añadir log para asegurar qué rol se está usando en la actualización
        const currentRole = localStorage.getItem('role') || 'desconocido';
        console.log(`[POCKETBASE RENAME] Intentando UPDATE con rol: ${currentRole} para record ID: ${recordId}`);
        
        // ACTUALIZACIÓN CLAVE: Usamos el campo nombre_visible para renombrar
        await pb.collection(FILE_COLLECTION).update(recordId, { 
            nombre_visible: newFileNameWithExt
        });
        
        // ✅ LOG DE ÉXITO: Confirmación en consola del cambio de nombre
        console.log(`✅ Nombre actualizado: "${oldFileNameWithExt}" -> "${newFileNameWithExt}"`);
        
        setEstado("✅ Archivo renombrado con éxito.");
        cargarArchivos(); // Recargar la lista es CRUCIAL para que el botón de descarga se actualice
    } catch (err) {
        console.error("❌ Error al renombrar (PocketBase):", err);
        setEstado(`❌ Error al renombrar archivo: ${err.message}. Revisa tus API Rules de UPDATE.`, true);
    }
}

// =================================================================
// 🔹 LÓGICA DE DESCARGA FORZADA (FETCH/BLOB) 🔹
// =================================================================
/**
 * 💡 SOLUCIÓN DEFINITIVA: Usa Fetch y Blob para forzar la descarga con el nombre editado.
 */
async function handleDownload(fileName, fileUrl) {
    setEstado(`⏳ Preparando descarga de ${fileName}...`);

    try {
        // PocketBase puede requerir autenticación para acceder al archivo. 
        // El cliente pb ya debe manejar los headers de auth.
        const response = await fetch(fileUrl); 
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}. Revisa tus reglas de lectura/permisos en PocketBase.`);
        
        const blob = await response.blob();
        
        // 1. Crear un URL temporal para el Blob
        const url = window.URL.createObjectURL(blob);
        
        // 2. Crear un enlace oculto y simular un clic
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName; // ¡Aquí forzamos el nombre!
        document.body.appendChild(a);
        a.click();
        
        // 3. Limpiar
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        clearEstado(); // Limpia el estado después de una descarga exitosa.
        
    } catch (error) {
        console.error("Error en la descarga por Blob:", error);
        setEstado(`❌ Error al descargar: ${error.message}`, true);
    }
}

// =======================================================
// file2.js (ROL ADMIN) - FUNCIÓN RENDER MODIFICADA
// =======================================================
function renderFileRow(record, curso, semana) {
    // 💡 CLAVE: Usa nombre_visible (si existe) o el nombre del archivo digital (para archivos antiguos).
    const displayFileName = record.nombre_visible || record.archivo_digital; 
    
    const fullPath = `${curso} / ${semana} / ${displayFileName}`;
    const fileUrl = getFileUrl(record); 
    const recordId = record.id; 
    
    const row = fileListBody.insertRow();
    row.className = 'border-t hover:bg-light transition';

    const nameCell = row.insertCell();
    // ✅ CAMBIO 1 (UI): Asegura que la celda de nombre se centre
    nameCell.className = 'py-3 px-4 text-sm text-primary font-medium break-words text-center';
    
    // ✅ CAMBIO 2 (UI): El botón/enlace debe ocupar todo el ancho para centrar el texto correctamente
    nameCell.innerHTML = `<button class="btn btn-link p-0 text-decoration-none w-100 text-center btn-action btn-action-view" data-filename="${displayFileName}" data-fileurl="${fileUrl}">${fullPath}</button>`;

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
                data-filename="${displayFileName}">Editar</button>
            
            <button class="btn btn-sm btn-dark w-100 btn-action btn-action-delete" 
                data-record-id="${recordId}" 
                data-filename="${displayFileName}">Borrar</button>
        </div>
    `;
}
// =================================================================
// 🔹 Escucha de Acciones & Modal - MODIFICADO PARA DESCARGA
// =================================================================

function handleActionClick(e) {
    // 1. Manejar botones de acción genéricos (View, Edit, Delete)
    const button = e.target.closest('.btn-action');
    if (button) {
        const fileName = button.getAttribute('data-filename'); 
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
    
    // 2. Manejar el botón de Descarga (NUEVO)
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
        contentHTML = `<div class="w-100 h-100 d-flex justify-content-center align-items-center">
            <img src="${publicUrl}" alt="${fileName}" class="img-fluid" style="max-height: 100%; max-width: 100%; object-fit: contain;">
        </div>`;
    } else if (type === "pdf" || type === "document") {
        let iframeSrc = publicUrl;
        if (type === "document") iframeSrc = `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;

        contentHTML = `
            <div class="w-100 h-100 d-flex flex-column">
                <iframe src="${iframeSrc}" title="Vista previa ${type}" class="w-100 border-0" style="flex-grow: 1; height: 100%;"></iframe>
                <div class="text-center p-2 bg-light w-100 flex-shrink-0 border-top">
                    <small class="text-muted">Si la previsualización falla, use el botón "Abrir en nueva pestaña".</small>
                </div>
            </div>`;
    } else {
        contentHTML = `<p class="text-center text-muted p-5">No se puede previsualizar este tipo de archivo.</p>`;
    }
    
    previewContent.innerHTML = contentHTML;
    previewModal.show();
}

// =================================================================
// 🔹 Funciones de Inicialización (Modificación)
// =================================================================
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const c = urlParams.get('c');
    const s = urlParams.get('s');

    if (c && s) { 
        // Lógica para cuando vienen de un enlace externo con parámetros
        urlCourse = c;
        urlWeek = s;
        if (cursoSelect) cursoSelect.style.display = 'none';
        if (semanaSelect) semanaSelect.style.display = 'none';
        if (uploadControls) uploadControls.classList.remove('d-none');
        if (dynamicTitle) dynamicTitle.textContent = `Documentos de ${c} - ${s}`;
    } else {
        // Lógica para cuando abres file1.html directamente
        // Aseguramos que los controles de subida/filtro se muestren
        
        if (uploadControls) uploadControls.classList.remove('d-none'); 
        if (dynamicTitle) dynamicTitle.textContent = "Selecciona un curso/semana";
        
        // Y limpia los estilos si existían
        if (cursoSelect) cursoSelect.style.display = '';
        if (semanaSelect) semanaSelect.style.display = '';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInit();
});