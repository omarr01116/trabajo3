// =======================================================
// file1.js (ROL USUARIO) - MIGRADO A RENDER/APPWRITE
// =======================================================

// 🔑 Supabase para la AUTENTICACIÓN
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; 

// 🛑 CONFIG BACKEND (Render)
const RENDER_BASE_URL = 'https://trabajo-backend.onrender.com';
const BACKEND_API_WORKS = `${RENDER_BASE_URL}/api/works`;
const LOGIN_URL = "./login.html"; 
const ADMIN_PAGE_URL = 'file2.html'; 

// 🚨 CONFIGURACIÓN DE SUPABASE (AUTH)
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo'; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// =================================================================
// 🔹 Variables
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
let urlCourse = null;
let urlWeek = null;

// =================================================================
// 🔹 Utilidad
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
// 🔹 Autenticación Supabase
// =================================================================
async function checkAuthAndInit() {
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();
    if (authError || !session) { 
        window.location.href = LOGIN_URL; 
        return; 
    }
    
    const userRole = localStorage.getItem('role') || 'usuario';

    if (userRole === 'invitado') {
        window.location.href = './portafolio.html'; 
        return;
    }
    
    role = userRole; 
    if (roleDisplay) roleDisplay.textContent = role.toUpperCase();
    if (uploadControls) uploadControls.classList.remove('d-none'); 

    checkUrlParams(); 
    await cargarArchivos(); 

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
// 🔹 Subir archivo (Render / Appwrite)
// =================================================================
async function handleUpload(e) {
    e.preventDefault();

    const file = fileInput.files[0];
    const token = localStorage.getItem('token'); 

    if (!token) return setEstado("⚠️ Sesión no válida. Inicia sesión.", true);
    if (!file) return setEstado("⚠️ Selecciona un archivo.", true);
    
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');

    if (!curso || !semana || curso === 'default' || semana === 'default') {
        return setEstado("⚠️ Selecciona curso y semana válidos.", true);
    }
    
    setEstado("⏳ Subiendo archivo...");

    const formData = new FormData();
    formData.append('documento', file); 
    // Usa el nombre del archivo como título automáticamente
    formData.append('titulo', `[${curso}] - [${semana}] - ${file.name}`);
    // Descripción automática opcional
    formData.append('descripcion', 'Archivo subido por usuario');

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
            const errorData = await response.json().catch(() => ({error: 'Fallo desconocido'}));
            setEstado(`❌ Error al subir: ${errorData.error || response.statusText}`, true);
        }
    } catch (error) {
        console.error('Error de red:', error);
        setEstado('❌ Error de red o servidor.', true);
    }
}

// =================================================================
// 🔹 Leer archivos (Render / Appwrite)
// =================================================================
async function cargarArchivos() {
    if (!fileListBody) return;
    
    setEstado("⏳ Cargando archivos...");
    
    const curso = urlCourse || (cursoSelect ? cursoSelect.value : '');
    const semana = urlWeek || (semanaSelect ? semanaSelect.value : '');
    const shouldFilter = !!curso && !!semana && curso !== 'default' && semana !== 'default';

    fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">Buscando documentos...</td></tr>`;

    try {
        const response = await fetch(BACKEND_API_WORKS, { method: 'GET' });
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const records = await response.json(); 
        let filtered = records;

        if (shouldFilter) {
            const cursoTerm = `[${curso.toLowerCase()}]`;
            const semanaTerm = `[${semana.toLowerCase()}]`;
            filtered = records.filter(r => {
                const titulo = r.titulo ? r.titulo.toLowerCase() : '';
                return titulo.includes(cursoTerm) && titulo.includes(semanaTerm);
            });
        }
        
        fileListBody.innerHTML = ''; 

        if (filtered.length === 0) {
            setEstado(`📭 Sin archivos para ${curso} - ${semana}`);
            fileListBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-secondary font-semibold">📭 No hay archivos.</td></tr>`;
            return;
        }
        
        filtered.forEach(record => renderFileRow(record)); 
        clearEstado();

    } catch (err) {
        console.error("Error al cargar:", err);
        setEstado(`❌ No se pudo cargar: ${err.message}`, true);
    }
}

function getFileUrl(record) {
    return record.fileUrl; 
}

function renderFileRow(record) {
    const fileUrl = getFileUrl(record); 
    const fileName = record.fileName || record.titulo; 
    const row = fileListBody.insertRow();
    row.className = 'border-t hover:bg-light transition';

    row.insertCell().innerHTML = `
        <button class="btn btn-link p-0 text-decoration-none text-start btn-action btn-action-view" 
            data-filename="${fileName}" data-fileurl="${fileUrl}">
            ${record.titulo}
        </button>`;

    row.insertCell().innerHTML = `
        <div class="btn-group">
            <button class="btn btn-sm btn-primary btn-action-view" data-filename="${fileName}" data-fileurl="${fileUrl}">Ver</button>
            <button class="btn btn-sm btn-success btn-action-download" data-filename-download="${fileName}" data-fileurl="${fileUrl}">Descargar</button>
        </div>`;
}

// =================================================================
// 🔹 Vista y descarga
// =================================================================
async function handleDownload(fileName, fileUrl) {
    setEstado(`⏳ Descargando ${fileName}...`);
    try {
        const response = await fetch(fileUrl); 
        if (!response.ok) throw new Error(`Error ${response.status}`);
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
        setEstado(`❌ Error: ${error.message}`, true);
    }
}

function handleActionClick(e) {
    const view = e.target.closest('.btn-action-view');
    if (view) openPreview(view.dataset.filename, view.dataset.fileurl);
    const dl = e.target.closest('.btn-action-download');
    if (dl) handleDownload(dl.dataset.filenameDownload, dl.dataset.fileurl);
}

function openPreview(fileName, url) {
    const type = detectType(fileName);
    if (!url) return setEstado("⚠️ Sin URL de archivo.", true);
    previewContent.innerHTML = ''; 
    previewFileNameSpan.textContent = fileName;
    previewLink.href = url;
    
    let contentHTML;
    if (type === "image") {
        contentHTML = `<img src="${url}" alt="${fileName}" class="img-fluid d-block mx-auto">`;
    } else if (type === "pdf" || type === "document") {
        const src = type === "document" ? 
            `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` : url;
        contentHTML = `<iframe src="${src}" class="w-100 border-0" style="height: 500px;"></iframe>`;
    } else {
        contentHTML = `<p class="text-center text-muted p-5">No se puede previsualizar.</p>`;
    }
    previewContent.innerHTML = contentHTML;
    previewModal.show();
}

// =================================================================
// 🔹 Manejo de URL
// =================================================================
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const c = urlParams.get('c');
    const s = urlParams.get('s');

    if (c && s) { 
        urlCourse = c;
        urlWeek = s;
        cursoSelect.style.display = 'none';
        semanaSelect.style.display = 'none';
        uploadControls.classList.remove('d-none');
        dynamicTitle.textContent = `Documentos de ${c} - ${s}`;
    } else {
        uploadControls.classList.remove('d-none'); 
        dynamicTitle.textContent = "Selecciona un curso/semana";
        cursoSelect.style.display = '';
        semanaSelect.style.display = '';
    }
}

document.addEventListener('DOMContentLoaded', () => checkAuthAndInit());
