// auth.js - Archivo de lógica del frontend

// =================================================================
// 🚨 CONFIGURACIÓN SEGURA - VALORES INSERTADOS
// =================================================================
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 

// 🎯 CLAVE PÚBLICA (ANON KEY): SEGURA PARA EL FRONTEND.
// Insertada según tu última configuración (rol:"anon").
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo'; 

// 🔥 URL del Backend Local (Para obtener el rol)
const BACKEND_URL = "http://localhost:3000/api/login"; 

// URLs para la redirección post-OAuth
const LOCAL_REDIRECT = "http://127.0.0.1:5500/pagina/login.html"; 
const GITHUB_REDIRECT = "https://omarr01116.github.io/trabajo/login.html"; 

// =================================================================
// 🔹 Inicialización de Supabase (Sintaxis Corregida y Segura)
// =================================================================
// ⭐ Soluciona el 'ReferenceError' y usa la clave pública.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const redirectTo = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? LOCAL_REDIRECT : GITHUB_REDIRECT;


// =================================================================
// 🔹 Variables de Estado (Manejo de DOM y Loading)
// =================================================================
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const googleBtn = document.getElementById('google-login-btn');
const submitBtn = document.getElementById('submit-btn');
const errorDisplay = document.getElementById('error-msg');
let loading = false;

// ---------------------
// 🔹 Utilidad para mostrar errores
// ---------------------
function setErrorMsg(msg) {
    errorDisplay.textContent = msg;
    errorDisplay.classList.remove('d-none');
}

// ---------------------
// 🔹 Utilidad para el estado de carga
// ---------------------
function setLoading(isLoading) {
    loading = isLoading;
    if (submitBtn) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Verificando...";
            submitBtn.classList.add('bg-secondary', 'cursor-not-allowed');
            submitBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = "Entrar";
            submitBtn.classList.remove('bg-secondary', 'cursor-not-allowed');
            submitBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        }
    }
}

// =================================================================
// 🔹 Obtener Rol y Redirigir (Lógica centralizada del componente Login)
// =================================================================
async function getRoleAndRedirect(token) {
    setLoading(true);
    try {
        // Llama al backend (localhost:3000) para que verifique el rol
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`, // Envía el token al backend
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            let errorText = `Error ${res.status} al obtener el rol.`;
            try {
                const errorResult = await res.json();
                errorText = errorResult.error || errorText;
            } catch (e) { /* ignore */ }
            throw new Error(errorText);
        }

        const result = await res.json();
        const rol = result.role?.trim().toLowerCase() || "usuario";

        localStorage.setItem("role", rol);
        localStorage.setItem("token", token);
        
        const destinos = {
            admin: "file.html",
            usuario: "file.html",
            invitado: "portafolio.html",
        };

        const destino = destinos[rol] || "file.html";
        
        // ⭐ INICIO DE LA CORRECCIÓN: EVITAR EL BUCLE INFINITO
        // Obtiene el nombre del archivo actual (ej: "file.html")
        const currentPage = window.location.pathname.split('/').pop().toLowerCase();

        // Solo redirige si la página actual NO es la página de destino
        if (currentPage !== destino.toLowerCase()) {
            console.log(`Redireccionando de ${currentPage} a ${destino}`);
            window.location.href = destino; 
        } else {
            // Si ya estamos en la página correcta, detenemos el estado de carga.
            console.log(`Ya estamos en la página de destino (${destino}). Deteniendo redirección.`);
            setLoading(false); 
        }
        // ⭐ FIN DE LA CORRECCIÓN

    } catch (err) {
        console.error("Error al obtener rol/redireccionar:", err);
        setErrorMsg(err.message || "Error de backend o red. Intenta de nuevo.");
        setLoading(false);
    }
}

// =================================================================
// 🔹 Login con Email y Contraseña
// =================================================================
async function handleSubmit(e) {
// ... (resto del código igual)
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        // 1. Autenticación con Supabase (usa la Anon Key)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.session) throw new Error("Correo o contraseña incorrectos.");

        // 2. Si es exitoso, llama al backend para obtener el rol
        await getRoleAndRedirect(data.session.access_token);

    } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Error al iniciar sesión.");
        setLoading(false);
    }
}

// =================================================================
// 🔹 Login con Google
// =================================================================
async function handleGoogleLogin() {
// ... (resto del código igual)
    setErrorMsg("");
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo },
        });
        if (error) throw error;
    } catch (err) {
        console.error("Error Google Login:", err.message);
        setErrorMsg("Error al iniciar sesión con Google.");
    }
}

// =================================================================
// 🔹 Verificación y Limpieza de Sesión
// =================================================================
async function checkInitialSession() {
// ... (resto del código igual)
    setLoading(true);
    const {
        data: { session },
    } = await supabase.auth.getSession();
    
    // Si hay sesión, intenta obtener el rol y redirigir
    if (session) {
        console.log("✅ Sesión activa detectada. Intentando obtener rol y redirigir...");
        await getRoleAndRedirect(session.access_token);
    } else {
        setLoading(false); // No hay sesión, mostramos el formulario
    }

    // Limpiar el hash de la URL después del callback de Google.
    if (window.location.hash.includes("access_token")) {
        console.log("Limpiando hash de OAuth de la URL...");
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
}

// ---------------------
// 🔹 Inicialización de Eventos
// ---------------------
document.addEventListener('DOMContentLoaded', () => {
// ... (resto del código igual)
    if (loginForm) loginForm.addEventListener('submit', handleSubmit);
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleLogin);
    checkInitialSession();
});

// ---------------------