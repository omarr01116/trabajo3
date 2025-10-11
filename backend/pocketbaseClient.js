// =======================================================
// DENTRO DE backend/pocketbaseClient.js - CORREGIDO
// =======================================================

// 🚨 CORRECCIÓN: Usar una URL de CDN para que el navegador pueda resolver el módulo.
import PocketBase from 'https://esm.sh/pocketbase@0.21.1'; // Usamos esm.sh con la versión (ajusta la versión si es necesario)

// Inicializa la conexión a tu servidor PocketBase 
// ⚠️ Asegúrate de que esta URL sea la correcta si no usas localhost:8090
const pb = new PocketBase('http://127.0.0.1:8090');

// =======================================================
// AÑADIDO PARA VERIFICAR LA CONEXIÓN (Mantenido)
// =======================================================

/**
 * Función que verifica asíncronamente si el servidor PocketBase está accesible.
 */
async function checkConnection() {
    try {
        const health = await pb.health.check(); 
        
        if (health.code === 200) {
            console.log('✅ PocketBaseClient: Conexión establecida con éxito.');
        } else {
            // Esto puede ocurrir si el servidor está en línea pero devuelve un código de mantenimiento, etc.
            console.warn(`⚠️ PocketBaseClient: Conexión establecida, pero el estado de salud no es 200. Código: ${health.code}`);
        }
    } catch (error) {
        // Esto captura fallos de red (CORS, servidor apagado, etc.)
        console.error('❌ PocketBaseClient: ERROR al conectar.', 'Asegúrate de que "pocketbase.exe serve" está corriendo en http://127.0.0.1:8090.', error);
    }
}

// Llama a la función para ejecutar la verificación inmediatamente.
// La instancia 'pb' se exporta inmediatamente, independientemente del resultado de esta llamada asíncrona.
checkConnection();

// =======================================================
// FIN DE LA VERIFICACIÓN
// =======================================================

// Exporta la instancia para que otros archivos JS puedan usarla
export default pb;