// =================================================================
// backend/appwriteClient.js (Versión Final para Render/Node.js)
// =================================================================

// ⚠️ Usamos 'node-appwrite' para entornos de servidor. Asegúrate de que esté instalado.
import { Client, Storage, Databases } from 'node-appwrite'; 

// 🛑🛑🛑 LECTURA DE VARIABLES DE ENTORNO EN RENDER 🛑🛑🛑
// Las claves secretas se leen del entorno para seguridad.
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID; 
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; 
// -----------------------------------------------------------------

// 1. Inicializa el cliente
const client = new Client();

// 2. Lógica de Configuración y Verificación
if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    // Si falta información crítica, solo logueamos el error y el cliente no funcionará.
    console.error('❌ ERROR CRÍTICO: Faltan APPWRITE_PROJECT_ID o APPWRITE_API_KEY en las variables de entorno de Render. El servicio de Appwrite estará deshabilitado.');
} else {
    // 3. Configuración del cliente (llamadas directas para evitar el TypeError)
    client.setEndpoint(APPWRITE_ENDPOINT);
    client.setProject(APPWRITE_PROJECT_ID);
    
    // CORRECCIÓN: setKey se llama directamente, no encadenado después de setProject.
    client.setKey(APPWRITE_API_KEY); 
    
    // 🚀 Mensaje de CONEXIÓN EXITOSA
    console.log('--- Appwrite Client Status ---');
    console.log(`✅ Conexión a Appwrite establecida.`);
    console.log(`🔗 Proyecto ID: ${APPWRITE_PROJECT_ID}`);
    console.log(`🌎 Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log('------------------------------');
}


// Exporta los módulos de Appwrite inicializados con el cliente.
export const storage = new Storage(client);
export const databases = new Databases(client);

export default client;