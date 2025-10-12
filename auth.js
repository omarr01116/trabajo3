// auth.js - Archivo de lógica del frontend

// =================================================================
// 🚨 CONFIGURACIÓN SEGURA - VALORES INSERTADOS
// =================================================================
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhend3aHdqcnV3Z3lmb215dHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjA1NTAsImV4cCI6MjA3MzczNjU1MH0.RzpCKpYV-GqNIhTklsQtRqyiPCGGmVlUs7q_BeBHxUo'; 

// 🔥 URL del Backend Local (Para obtener el rol)
const BACKEND_URL = "https://trabajo-backend.onrender.com/api/login"; 

// URLs para la redirección post-OAuth
const LOCAL_REDIRECT = "http://127.0.0.1:5500/pagina/login.html"; 
// ⭐ CORRECCIÓN DE RUTA: Cambiado de /trabajo/ a /trabajo3/
const GITHUB_REDIRECT = "https://omarr01116.github.io/trabajo3/login.html"; 

// =================================================================
// 🔹 Inicialización de Supabase
// =================================================================
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
// 🔹 Obtener Rol y Redirigir (Lógica centralizada) - FINAL
// =================================================================
async function getRoleAndRedirect(token) {
    setLoading(true);
    try {
        // Llama al backend (localhost:3000) para obtener el rol
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
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
        // ⭐ La clave: si el backend no devuelve rol, asumimos "usuario"
        const rol = result.role?.trim().toLowerCase() || "usuario"; 

        localStorage.setItem("role", rol);
        localStorage.setItem("token", token);
        
        const destinos = {
            admin: "file2.html",       // Destino para 'admin'
            usuario: "file1.html",     // Destino para 'usuario'
            invitado: "portafolio.html",
        };

        // Si el rol es 'usuario' o cualquier otro valor no reconocido (fallbacks), 
        // redirigirá a 'file1.html'.
        const destino = destinos[rol] || "file1.html"; 
        
        // ⭐ Lógica de Redirección Final (Evita el bucle al comparar la URL)
        const currentPage = window.location.pathname.split('/').pop().toLowerCase();

        if (currentPage !== destino.toLowerCase()) {
            console.log(`Redireccionando de ${currentPage} a ${destino}`);
            window.location.href = destino; 
        } else {
            console.log(`Ya estamos en la página de destino (${destino}). Deteniendo redirección.`);
            setLoading(false);
        }
    } catch (err) {
        console.error("Error al obtener rol/redireccionar:", err);
        // ⭐ NOTA: Si este error es un 404 (Fallo de Backend), la página se queda en login.html
        setErrorMsg(err.message || "Error de backend o red. Intenta de nuevo.");
        setLoading(false);
    }
}
// =================================================================
// 🔹 Login con Email y Contraseña
// =================================================================
async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.session) throw new Error("Correo o contraseña incorrectos.");

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

/**
 * Verifica la sesión y limpia el hash de la URL.
 * La redirección principal se maneja en el listener.
 */
async function checkInitialSession() {
    // Si ya estamos en DOMContentLoaded y el hash no está presente, 
    // solo establecemos el estado de carga y verificamos.
    if (!window.location.hash.includes("access_token")) {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            setLoading(false);
        }
    }

    // Limpiar el hash de la URL después del callback de Google.
    if (window.location.hash.includes("access_token")) {
        console.log("Limpiando hash de OAuth de la URL...");
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
}

// ---------------------
// 🔹 Escucha de cambios de Auth (Listener)
// ---------------------
let hasRedirected = false; // Flag para asegurar la redirección única

supabase.auth.onAuthStateChange((event, session) => {
    // Solo actuamos si el evento es SIGNED_IN y NO hemos redirigido ya.
    if (session && event === 'SIGNED_IN' && !hasRedirected) {
        console.log(`✅ Evento Supabase: ${event} detectado. Iniciando redirección.`);
        getRoleAndRedirect(session.access_token);
        hasRedirected = true; // Bloquea futuras redirecciones por este evento/carga
    }
    
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem("role");
        localStorage.removeItem("token");
        hasRedirected = false;
    }
});


// =================================================================
// 🔹 Inicialización de Eventos (¡CORRECCIÓN DE FLUJO CRÍTICA!)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // ⭐ LÓGICA CRÍTICA DE REDIRECCIÓN DE HASH (Máxima prioridad)
    if (window.location.hash.includes("access_token")) {
        try {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const token = params.get('access_token');
            
            if (token) {
                console.log("Token detectado en Hash. Forzando obtención de rol y redirección.");
                // Llamamos a la lógica principal de redirección
                getRoleAndRedirect(token); 
                return; // 🛑 Detiene el resto de la ejecución para priorizar la redirección
            }
        } catch (e) {
            console.error("Error al procesar hash de URL:", e);
        }
    }
    // ⭐ FIN DE LÓGICA CRÍTICA

    // Si no hay token en el hash, procedemos con la inicialización normal
    if (loginForm) loginForm.addEventListener('submit', handleSubmit);
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleLogin);
    checkInitialSession();
});