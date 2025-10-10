// /pagina/auth.js (Frontend)

// =================================================================
// 🚨 CONFIGURACIÓN - ¡INSERTA TUS VALORES REALES AQUÍ!
// =================================================================
// 1. URL de Supabase
const SUPABASE_URL = 'https://bazwwhwjruwgyfomyttp.supabase.co'; 
// 2. CLAVE PÚBLICA (ANON KEY)
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANONIMA_REAL_AQUI'; // 🛑 ¡IMPORTANTE: ESTA NO ES LA SERVICE_ROLE KEY!
// 3. URL del Backend Local
const BACKEND_URL = "http://localhost:3000/api/login"; 

// URLs para la redirección post-OAuth
const LOCAL_REDIRECT = "http://127.0.0.1:5500/pagina/login.html";
const GITHUB_REDIRECT = "https://omarr01116.github.io/trabajo3/pagina/login.html"; // Ajustado a trabajo3

// =================================================================
// 🔹 Inicialización de Supabase
// =================================================================
// ⭐ CORRECCIÓN DE SINTAXIS: Usamos window.supabase.createClient para evitar el error.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

// =================================================================
// 🔹 Obtener Rol y Redirigir (Lógica centralizada del componente Login)
// =================================================================
async function getRoleAndRedirect(token) {
    setLoading(true);
    try {
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
            } catch (e) {
                // No es JSON, usar el error por defecto
            }
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
        
        // Redirección exitosa a la página de destino
        window.location.href = destino; 

    } catch (err) {
        console.error("Error al obtener rol/redireccionar:", err);
        setErrorMsg(err.message || "Error de backend o red. Intenta de nuevo.");
        setLoading(false);
        // Opcional: Forzar cierre de sesión si el rol falla
        // await supabase.auth.signOut(); 
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
        // Supabase redirige a la URL base que ya definimos
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
// 🔹 Verificación y Limpieza de Sesión (el 'useEffect' de React)
// =================================================================
async function checkInitialSession() {
    setLoading(true);
    const {
        data: { session },
    } = await supabase.auth.getSession();
    
    // Si hay sesión, intentamos obtener el rol y redirigir
    if (session) {
        console.log("✅ Sesión activa detectada. Intentando obtener rol y redirigir...");
        await getRoleAndRedirect(session.access_token);
        // Si la redirección falla o hay error de rol, loading se pondrá en false en getRoleAndRedirect
    } else {
        setLoading(false); // No hay sesión, mostramos el formulario
    }

    // 🚨 Limpiar el hash de la URL después del callback de Google.
    if (window.location.hash.includes("access_token")) {
        console.log("Limpiando hash de OAuth de la URL...");
        // Usar history.replaceState para limpiar el hash sin recargar
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
}

// ---------------------
// 🔹 Inicialización de Eventos
// ---------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Asignar listeners
    if (loginForm) loginForm.addEventListener('submit', handleSubmit);
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleLogin);

    // 2. Verificar sesión inicial
    checkInitialSession();
});

// ---------------------
// 🔹 Escucha de cambios de Auth (maneja el callback post-OAuth)
// ---------------------
supabase.auth.onAuthStateChange((event, session) => {
    // Disparamos la acción de redirección solo si hay una sesión y el evento es SIGNED_IN
    if (session && event === 'SIGNED_IN') {
        console.log(`✅ Evento Supabase: ${event}. Redirigiendo...`);
        getRoleAndRedirect(session.access_token);
    }
    // Manejar el evento de cierre de sesión
    if (event === 'SIGNED_OUT') {
        localStorage.removeItem("role");
        localStorage.removeItem("token");
    }
});