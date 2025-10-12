// pagina/backend/appwriteClient.js

import { Client, Storage, Databases } from 'appwrite';

// 🛑 TUS VALORES DE CREDENCIALES
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '68ea7b28002bd7addb54'; 
const APPWRITE_API_KEY = 'standard_0d044f74d9b7a93a38c0e0aeb640a9d0bb686e53b745c203d2a5ee9f826f70b00ae04c37d6fceb7bf9fd6531d480fdb85db7be6c07ede7a4f6641379f692ca0487519707034090da31f99fb359de02cc36469e816990999581f86e7ee4fcb3ee01c6cada88a3524d6635f084867096f266d78a859e1a61922df8d477240687d0'; 

const client = new Client();

// Configuración de la conexión con el endpoint y la clave de servidor
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY); 

// 🚀 Mensaje de CONEXIÓN EXITOSA
// Este mensaje aparecerá en los logs de Render al iniciar el servicio.
console.log('--- Appwrite Client Status ---');
console.log(`✅ Conexión a Appwrite establecida.`);
console.log(`🔗 Proyecto ID: ${APPWRITE_PROJECT_ID}`);
console.log(`🌎 Endpoint: ${APPWRITE_ENDPOINT}`);
console.log('------------------------------');

// Exporta los módulos de Appwrite que usarás en routes/works.js
export const storage = new Storage(client);
export const databases = new Databases(client);

export default client;