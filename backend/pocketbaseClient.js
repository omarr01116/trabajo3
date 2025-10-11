// DENTRO DE backend/pocketbaseClient.js
import PocketBase from 'pocketbase';

// Inicializa la conexión a tu servidor PocketBase (debe estar corriendo en el puerto 8090)
const pb = new PocketBase('http://127.0.0.1:8090');

// =======================================================
// AÑADIDO PARA VERIFICAR LA CONEXIÓN
// =======================================================

/**
 * Función que verifica asíncronamente si el servidor PocketBase está accesible.
 */
async function checkConnection() {
    try {
        // La API 'health' es una ruta ligera que comprueba si el servidor está en línea.
        const health = await pb.health.check(); 
        
        if (health.code === 200) {
            console.log('✅ PocketBaseClient: Conexión establecida con éxito.');
        } else {
            console.warn(`⚠️ PocketBaseClient: Conexión establecida, pero el estado de salud no es 200. Código: ${health.code}`);
        }
    } catch (error) {
        console.error('❌ PocketBaseClient: ERROR al conectar.', 'Asegúrate de que "pocketbase.exe serve" está corriendo.', error);
    }
}

// Llama a la función para ejecutar la verificación inmediatamente.
checkConnection();

// =======================================================
// FIN DE LA VERIFICACIÓN
// =======================================================

// Exporta la instancia para que otros archivos JS puedan usarla
export default pb;