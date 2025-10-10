// =================================================================
// ✅ CONFIGURACIÓN DE SUPABASE (CORREGIDO) ✅
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
// 🔹 Funciones de Utilidad (Deben ir aquí)
// =================================================================
// ... (detectType, setEstado, clearEstado, getPathForStorage) ...


// =================================================================
// 🔹 Funciones de Inicialización y Autenticación (ORDEN CORRECTO)
// =================================================================

/**
 * Lee los parámetros de la URL y ajusta la interfaz de usuario.
 * (Función que faltaba y causaba el error ReferenceError)
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
        uploadControls.style.display = 'none';

        // 2. Insertar el título dinámico
        dynamicTitle.textContent = `${urlCourse} - ${urlWeek}`;
        
        // 3. Crear y configurar el botón de Volver
        const backBtn = document.createElement('button');
        backBtn.textContent = `← Volver a Cursos`;
        backBtn.className = 'btn btn-primary rounded-pill px-4 py-2 me-3 transition mb-3 mb-md-0';
        backBtn.addEventListener('click', () => {
            window.location.href = `curso.html?name=${encodeURIComponent(urlCourse)}`;
        });
        
        // Mover el título a la derecha y añadir el botón a la izquierda
        headerManagement.classList.remove('justify-content-start');
        headerManagement.classList.add('justify-content-between');
        headerManagement.prepend(backBtn);
        
    } else {
        // MODO GESTIÓN GENERAL
        dynamicTitle.textContent = 'Gestión General de Archivos';
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
        
        roleDisplay.textContent = role.toUpperCase();
        console.log(`✅ Rol detectado: ${role}. Acceso concedido.`);

        // 3. INICIALIZACIÓN DE UI Y DATOS
        checkUrlParams(); // ⬅️ ¡AHORA ESTÁ DEFINIDA!
        await cargarArchivos(); 

        // 4. ASIGNAR LISTENERS
        // ... (El resto de los listeners) ...
        
    } catch (e) {
        console.error("❌ Error CRÍTICO en checkAuthAndInit:", e);
        setEstado(`❌ Error de inicialización: ${e.message}`, true);
    }
}

// ... (El resto de las funciones: cargarArchivos, handleUpload, etc. ) ...