// =================================================================
// 🚨 CONFIGURACIÓN DE SUPABASE (TUS VALORES REALES DEBEN IR AQUÍ) 🚨
// =================================================================
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo';
const BUCKET_NAME = 'archivos'; 
const LOGIN_URL = "./login.html"; 

// Inicializar el cliente Supabase
const { createClient } = supabase;
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

/** Codifica una ruta para Supabase Storage */
function getPathForStorage(path) {
    const segments = path.split('/');
    const encodedSegments = segments.map(segment => encodeURIComponent(segment));
    return encodedSegments.join('/');
}


// =================================================================
// 🔹 Funciones de Inicialización y Autenticación (ORDEN CORREGIDO)
// =================================================================

/**
 * Lee los parámetros de la URL y ajusta la interfaz de usuario.
 * (MOVIDA A ESTA POSICIÓN PARA RESOLVER EL ReferenceError)
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
        checkUrlParams(); // ✅ LLAMADA AHORA FUNCIONA
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
// 🔹 Cargar Archivos (SELECT)
// =================================================================
async function cargarArchivos() {
    // Verificaciones básicas
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
            .list(getPathForStorage(folderPath), { limit: 100 }); 

        if (error) throw error;
        
        fileListBody.innerHTML = ''; 

        if (data && data.length > 0) {
            // ... (Lógica de renderizado de la tabla) ...
            data.forEach(archivo => {
                 const fullPath = `${folderPath}/${archivo.name}`; 
                
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

                    ${role === 'admin' || role === 'usuario' ? 
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
        // Si el error es de permiso (403), puedes mostrar un mensaje específico
        if (err.status === 403 || err.message.includes("Policy")) {
            setEstado("🚫 Permiso denegado por políticas RLS. Revisa tus políticas de SELECT.", true);
        } else {
            setEstado(`❌ Error al obtener archivos: ${err.message}`, true);
        }
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


// ... (El resto de las funciones: handleActionClick, handleEdit, handleDelete, openPreview, handleLogout, y el listener DOMContentLoaded permanecen IGUAL) ...