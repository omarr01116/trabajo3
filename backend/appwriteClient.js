// =================================================================
// backend/appwriteClient.js (Corregido para Entorno de Servidor/Node.js)
// =================================================================

// ⚠️ NOTA CRÍTICA: Para el entorno de Node.js, debes instalar y usar 'node-appwrite'
// Si tu package.json no lo tiene, ejecútalo: npm install node-appwrite

// Importamos los módulos de 'node-appwrite'
import { Client, Storage, Databases } from 'node-appwrite'; 

// 🛑🛑🛑 IMPORTANTE: LEER VARIABLES DE ENTORNO EN RENDER 🛑🛑🛑
// Estas variables deben estar definidas en la configuración de Render
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID; 
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; 
// -----------------------------------------------------------------

// 1. Inicializa el cliente
const client = new Client();

// 2. Configuración de la conexión (Métodos separados, sin encadenar setKey)
// Si alguna variable de entorno falta, esto puede fallar.

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.error('❌ ERROR: Faltan APPWRITE_PROJECT_ID o APPWRITE_API_KEY en las variables de entorno de Render.');
} else {
    client.setEndpoint(APPWRITE_ENDPOINT);
    client.setProject(APPWRITE_PROJECT_ID);
    
    // 💥 CORRECCIÓN CRÍTICA: setKey o setSecret debe llamarse directamente en el cliente.
    // Usamos setKey, que es el método correcto para las API Keys de Servidor.
    client.setKey(APPWRITE_API_KEY); 
    
    // 🚀 Mensaje de CONEXIÓN EXITOSA
    console.log('--- Appwrite Client Status ---');
    console.log(`✅ Conexión a Appwrite establecida.`);
    console.log(`🔗 Proyecto ID: ${APPWRITE_PROJECT_ID}`);
    console.log(`🌎 Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log('------------------------------');
}


// Exporta los módulos de Appwrite que usarás en tus rutas
export const storage = new Storage(client);
export const databases = new Databases(client);

export default client;