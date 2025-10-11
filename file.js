import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =================================================================
// 🚨 CONFIGURACIÓN DE SUPABASE (TUS VALORES REALES DEBEN IR AQUÍ) 🚨
// =================================================================
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo';
const BUCKET_NAME = 'archivos'; 
const LOGIN_URL = "./login.html"; 

// Inicializar el cliente Supabase
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

// Modal y elementos de previsualización
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'), {});
const previewContent = document.getElementById('preview-content');
const previewLink = document.getElementById('preview-link');
const previewFileNameSpan = document.getElementById('preview-filename'); 

// Estado de la sesión
let role = localStorage.getItem('role') || 'usuario';
let urlCourse = null;
let urlWeek = null;


// =================================================================
// 🔹 Funciones de Utilidad
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

/** Codifica una ruta para Supabase Storage (asegura que los espacios se manejen). */
function getPathForStorage(path) {
    const segments = path.split('/');
    const encodedSegments = segments.map(segment => encodeURIComponent(segment));
    return encodedSegments.join('/');
}


// =================================================================
// 🔹 Funciones de Carga de Archivos
// =================================================================

/**
 * Carga los archivos del Storage para la ruta seleccionada.
 */
async function cargarArchivos() {
    if (!cursoSelect || !semanaSelect || !fileListBody) {
        console.error("❌ Elementos DOM de selección/lista no encontrados.");
        setEstado("❌ Error de inicialización del DOM para los selectores/lista.", true);
        return;
    }
    
    setEstado("⏳ Cargando archivos...");
    
    const curso = urlCourse || cursoSelect.value;
    const semana = urlWeek || semanaSelect.value;
    
    const folderPath = `${curso}/${semana}`;
    
    fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">Cargando ${curso} - ${semana}...</td></tr>`;

    try {
        const { data, error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            // CORREGIDO: Usamos folderPath sin codificar para .list()
            .list(folderPath, { limit: 100 }); 

        if (error) throw error;
        
        fileListBody.innerHTML = ''; 

        if (data && data.length > 0) {
            // Filtrar para excluir subdirectorios
            const archivosVisibles = data.filter(item => item.id && item.created_at);
            
            if (archivosVisibles.length === 0) {
                 setEstado(`📭 Sin archivos en ${curso} - ${semana}`);
                 fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos en este curso/semana</td></tr>`;
                 return;
            }
            
            archivosVisibles.forEach(archivo => {
                const fullPath = `${folderPath}/${archivo.name}`; // Path sin codificar (ej: 'Curso/Semana/Archivo.pdf')
                
                const row = fileListBody.insertRow();
                row.className = 'border-t hover:bg-light transition';

                const nameCell = row.insertCell();
                nameCell.className = 'py-3 px-4 text-sm text-primary font-medium break-words';
                nameCell.innerHTML = `<button class="btn btn-link p-0 text-decoration-none text-start btn-action btn-action-view" data-path="${fullPath}">${archivo.name}</button>`;

                const actionsCell = row.insertCell();
                actionsCell.className = 'py-3 px-4 text-center d-flex justify-content-center align-items-center';

                actionsCell.innerHTML = `
                    <button class="btn btn-sm btn-primary rounded-pill font-medium me-2 btn-action btn-action-view" data-path="${fullPath}">Ver</button>
                    
                    ${role === 'admin' ? 
                        `<button class="btn btn-sm btn-warning rounded-pill font-medium me-2 btn-action btn-action-edit" data-path="${fullPath}" data-filename="${archivo.name}">Editar</button>` 
                        : ''
                    }

                    ${role === 'admin' || role === 'usuario' ? // Revertido para permitir eliminar si RLS lo autoriza
                        `<button class="btn btn-sm btn-danger rounded-pill font-medium btn-action btn-action-delete" data-path="${fullPath}">Borrar</button>` 
                        : ''
                    }
                `;
            });
            clearEstado();
        } else {
            setEstado(`📭 Sin archivos en ${curso} - ${semana}`);
            fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos en este curso/semana</td></tr>`;
        }
    } catch (err) {
        console.error("Error al cargar archivos (Storage List):", err);
        if (err.status === 403 || err.message.includes("Policy")) {
            setEstado("🚫 Permiso denegado por políticas RLS. Revisa tus políticas de SELECT.", true);
        } else {
            setEstado(`❌ Error al obtener archivos: ${err.message}`, true);
        }
    }
}


// =================================================================
// 🔹 Funciones de Inicialización y Autenticación
// =================================================================

/**
 * Lee los parámetros de la URL y ajusta la interfaz de usuario.
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const week = urlParams.get('week');
    const headerManagement = document.getElementById('header-management');

    if (course && week) {
        // MODO NAVEGACIÓN (Viniendo de curso.html)
        urlCourse = decodeURIComponent(course.replace(/\+/g, ' '));
        urlWeek = decodeURIComponent(week.replace(/\+/g, ' '));
        
        // 1. Ocultar selectores de subida
        if (uploadControls) uploadControls.style.display = 'none';

        // 2. Insertar el título dinámico
        if (dynamicTitle) dynamicTitle.textContent = `${urlCourse} - ${urlWeek}`;
        
        // 3. Crear y configurar el botón de Volver
        const backBtn = document.createElement('button');
        backBtn.textContent = `← Volver a Cursos`;
        backBtn.className = 'btn btn-primary rounded-pill px-4 py-2 me-3 transition mb-3 mb-md-0';
        backBtn.addEventListener('click', () => {
            window.location.href = `curso.html?name=${encodeURIComponent(urlCourse)}`;
        });
        
        // Ajustar el header
        if (headerManagement) {
            headerManagement.classList.remove('justify-content-start');
            headerManagement.classList.add('justify-content-between');
            headerManagement.prepend(backBtn);
        }
        
    } else {
        // MODO GESTIÓN GENERAL
        if (dynamicTitle) dynamicTitle.textContent = 'Gestión General de Archivos';
    }
}


/** Verifica la sesión con Supabase, protege la ruta e inicializa listeners. */
async function checkAuthAndInit() {
    console.log("🛠️ Iniciando verificación de autenticación...");
    
    try {
        const { data: { session }, error: authError } = await supabaseClient.auth.getSession();

        if (authError) {
            console.error("❌ Error al obtener sesión de Supabase:", authError);
            setEstado("❌ Error de conexión al servidor de autenticación.", true);
            return;
        }

        if (!session) {
            console.log("⚠️ Sesión no encontrada. Redirigiendo al login...");
            window.location.href = LOGIN_URL;
            return; 
        }

        // --- DIAGNÓSTICO: CONEXIÓN EXITOSA ---
        console.log("✅ Conexión con Supabase y Sesión ACTIVA.");
        console.log(`👤 ID de Usuario (UID): ${session.user.id}`);
        // ------------------------------------
        
        // 2. OBTENER Y VERIFICAR ROL
        role = localStorage.getItem('role') || 'usuario'; 
        
        if (role === 'invitado') {
            console.log(`⚠️ Rol detectado: ${role}. Redirigiendo a portafolio.`);
            window.location.href = './portafolio.html'; 
            return;
        }
        
        if (roleDisplay) roleDisplay.textContent = role.toUpperCase();
        console.log(`✅ Rol detectado: ${role}. Acceso concedido.`);

        // 3. INICIALIZACIÓN DE UI Y DATOS
        checkUrlParams(); 
        await cargarArchivos(); 

        // 4. ASIGNAR LISTENERS
        if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
        document.addEventListener('click', handleActionClick); 
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        if (!urlCourse && !urlWeek) {
            if (cursoSelect) cursoSelect.addEventListener('change', cargarArchivos);
            if (semanaSelect) semanaSelect.addEventListener('change', cargarArchivos);
        }
        
    } catch (e) {
        console.error("❌ Error CRÍTICO en checkAuthAndInit:", e);
        setEstado(`❌ Error de inicialización: ${e.message}`, true);
    }
}


// =================================================================
// 🔹 Subir archivo (INSERT)
// =================================================================
async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return setEstado("⚠️ Selecciona un archivo primero", true);
    
    setEstado("⏳ Subiendo...");
    
    // USAR LAS VARIABLES DE URL SI ESTÁN EN MODO NAVEGACIÓN
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');

    if (!curso || !semana) return setEstado("⚠️ Selecciona un curso y una semana válidos.", true);

    const filePath = `${curso}/${semana}/${file.name.trim()}`; 

    try {
        const { error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(getPathForStorage(filePath), file, { upsert: true });

        if (error) throw error;

        setEstado("✅ Archivo subido con éxito");
        if (fileInput) fileInput.value = ''; 
        cargarArchivos();
    } catch (err) {
        console.error("Error al subir archivo:", err);
        setEstado("❌ Error al subir archivo: " + err.message, true);
    }
}


// =================================================================
// 🔹 Escucha de Acciones (Descarga/Eliminación/Edición/Vista previa)
// =================================================================

function handleActionClick(e) {
    const button = e.target.closest('.btn-action');
    if (!button) return;
    
    // Obtiene el path sin codificar (ej: 'Curso/Semana/Archivo.pdf')
    const fullPath = button.getAttribute('data-path'); 
    
    if (!fullPath) return;

    // Obtener solo el nombre del archivo para prompts y funciones
    const fileNameOnly = fullPath.split('/').pop(); 
    
    if (button.classList.contains('btn-action-view')) {
        // CORREGIDO: Pasamos solo el nombre del archivo.
        openPreview(fileNameOnly); 

    } else if (button.classList.contains('btn-action-edit')) {
        // CORREGIDO: Pasamos el fullPath sin codificar
        handleEdit(fullPath, fileNameOnly); 

    } else if (button.classList.contains('btn-action-delete')) {
        if (confirm(`¿Eliminar ${fileNameOnly}?`)) {
            // CORREGIDO: Pasamos el fullPath sin codificar
            handleDelete(fullPath); 
        }
    }
}


// =================================================================
// 🔹 Renombrar archivo (MOVE)
// =================================================================
async function handleEdit(oldFullPath, oldFileName) {
    if (role !== "admin") return setEstado("⚠️ Solo el admin puede editar nombres.", true);

    const newName = prompt(`Renombrando "${oldFileName}".\nIngresa el nuevo nombre del archivo (incluye la extensión):`);
    if (!newName || newName.trim() === '' || newName.trim() === oldFileName) return;
    if (newName.includes('/')) return setEstado("⚠️ El nombre no puede contener '/'", true); 
    
    setEstado("⏳ Renombrando...");
    
    const pathParts = oldFullPath.split('/');
    pathParts.pop(); 
    pathParts.push(newName.trim());
    
    const newFullPath = pathParts.join('/');
    
    // Codificación única (necesaria para move)
    const encodedOldPath = getPathForStorage(oldFullPath);
    const encodedNewPath = getPathForStorage(newFullPath);

    try {
        const { error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .move(encodedOldPath, encodedNewPath); 

        if (error) throw error;

        setEstado(`✏️ Archivo renombrado a: ${newName.trim()}`);
        cargarArchivos();
    } catch (err) {
        setEstado(`❌ Error al renombrar archivo: ${err.message || "Error desconocido"}`, true);
        console.error("Error al renombrar archivo:", err);
    }
}
// =================================================================
// 🔹 Borrar archivo (DELETE)
// CORREGIDO: Usaremos 'window.handleDelete' para garantizar que sea global y accesible
// =================================================================
window.handleDelete = async (fullPath) => { 
    // Si el usuario no es admin o usuario, salir.
    if (role !== "admin" && role !== "usuario") return setEstado("⚠️ No tienes permiso para eliminar.", true);

    setEstado("⏳ Eliminando...");
    
    // Codificación única (necesaria para remove)
    const encodedPath = getPathForStorage(fullPath);

    // DEBUGGING: Añadir la línea de depuración
    console.log("DEBUG DELETE: Ruta de eliminación CODIFICADA ENVIADA:", encodedPath);

    try {
        const { error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .remove([encodedPath]);

        if (error) {
            // AÑADIR/MODIFICAR ESTE console.log PARA DEBUGGING RLS
            console.error("DEBUG RLS: Objeto de error completo de la API:", error); 
            
            // Ajuste de mensaje de error para dar pistas sobre RLS/Permisos
            if (error.status === 400 && error.message.includes("permission")) {
                 throw new Error("🚫 Permiso denegado. Revisa tu política RLS de DELETE.");
            }
            throw error;
        }

        setEstado("🗑️ Archivo eliminado correctamente");
        cargarArchivos();
    } catch (err) {
        console.error("DEBUG RLS: Error final capturado:", err);
        setEstado(`❌ Error al eliminar archivo: ${err.message}`, true);
    }
}
// =================================================================
// 🔹 Vista previa
// =================================================================
function openPreview(fileName) {
    const curso = urlCourse || cursoSelect.value;
    const semana = urlWeek || semanaSelect.value;
    
    // 1. Path completo SIN codificar (RUTA LITERAL: 'Arquitectura de Software/Semana 1/archivo.pdf')
    const fullPath = `${curso}/${semana}/${fileName}`;

    // 2. ¡LÍNEA ELIMINADA! 🚫 ESTO CAUSABA LA DOBLE CODIFICACIÓN
    // const finalEncodedPath = getPathForStorage(fullPath); 
    
    const { data: publicData } = supabaseClient.storage
        .from(BUCKET_NAME)
        // 3. ¡LÍNEA MODIFICADA! 🔄 Ahora usamos la ruta literal (fullPath). 
        // Supabase aplica la codificación UNA sola vez aquí, resolviendo el 'Invalid Key'.
        .getPublicUrl(fullPath); // <-- USAMOS fullPath SIN codificar
        
    const publicUrl = publicData?.publicUrl || null;
    const type = detectType(fileName);

    if (!publicUrl) return setEstado("⚠️ No se pudo obtener la URL pública del archivo", true);

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
        // La URL dentro del gview de Google DEBE estar codificada
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
// 🔹 Logout
// =================================================================
async function handleLogout() {
    await supabaseClient.auth.signOut();
    localStorage.clear();
    window.location.href = LOGIN_URL; 
}
// =================================================================
// 🔹 Inicialización
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInit();
});