// /backend/routes/works.js (FINAL - MIGRACIÓN COMPLETA A APPWRITE)

import express from "express";
// Mantenemos los middlewares de seguridad
import { verificarToken, soloAdmin } from "../middleware/auth.js";
// 🎯 Imports de Appwrite, Multer y FS
import multer from 'multer'; 
import fs from 'fs/promises'; 
import { storage, databases } from '../appwriteClient.js'; // Conexión Appwrite
import { ID } from 'appwrite'; // Para IDs únicos

const router = express.Router();

// 🛑🛑🛑 TUS VALORES REALES DE APPWRITE CONFIRMADOS 🛑🛑🛑
const DATABASE_ID = '68ebd97b002ffc08ca90'; 
const COLLECTION_ID = 'trabajodocs'; // Tu ID de Colección
const BUCKET_ID = '68ebd7b1000a707b10f2'; // Tu ID de Bucket

// 1. CONFIGURACIÓN DE MULTER: Guarda el archivo temporalmente
// Multer guarda el archivo subido en una carpeta temporal 'uploads/' en el servidor de Render
const upload = multer({ dest: 'uploads/' }); 


// 📌 GET /api/works -> lista de trabajos (PÚBLICO)
router.get("/works", async (req, res) => {
    try {
        // Reemplazamos el array simulado por una lectura de la Base de Datos de Appwrite
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);

        // Retorna la lista de trabajos con sus URLs de archivos
        res.json(response.documents); 
    } catch (error) {
        console.error("Error al obtener trabajos:", error);
        res.status(500).json({ error: "No se pudo obtener la lista de trabajos de Appwrite." });
    }
});

// 📌 POST /api/works -> subir nuevo trabajo (SOLO ADMIN)
// ⚠️ Usamos 'upload.single('documento')' para que el archivo se envíe con el campo 'documento'
router.post("/works", verificarToken, soloAdmin, upload.single('documento'), async (req, res) => {
    try {
        // req.body contiene los campos de texto, req.file contiene el archivo
        const { titulo, descripcion } = req.body;
        const fileToUpload = req.file; 

        if (!titulo || !fileToUpload) {
            // Ahora verificamos la existencia del campo de texto 'titulo' y del archivo 'documento'
            return res.status(400).json({ error: "Título y Archivo (documento) son requeridos" });
        }

        // --- 1. SUBIR EL ARCHIVO A APPWRITE STORAGE (PERSISTENCIA) ---
        
        const uploadedFile = await storage.createFile(
            BUCKET_ID,          // ID de tu bucket 'archivos'
            ID.unique(),        // Genera un ID único para el archivo
            fileToUpload.path   // Ruta temporal donde Multer lo guardó
        );
        
        // --- 2. LIMPIEZA: ELIMINAR EL ARCHIVO TEMPORAL DE RENDER ---
        // ¡Crucial para mantener limpio el disco de tu servidor gratuito!
        await fs.unlink(fileToUpload.path); 

        // --- 3. GUARDAR LA REFERENCIA EN LA BASE DE DATOS DE APPWRITE ---
        
        // Creamos la URL pública para que el frontend pueda ver el documento
        const fileUrl = `${storage.client.config.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${storage.client.config.project}`;
        
        const nuevoTrabajoData = {
            titulo,
            descripcion,
            fileId: uploadedFile.$id, // Guardamos la referencia
            fileName: uploadedFile.name,
            fileUrl: fileUrl, 
            // Los campos 'creadoPor' y 'role' se omiten, simplificando la DB
        };

        const trabajoGuardado = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(), // ID del documento de la base de datos
            nuevoTrabajoData
        );

        res.status(201).json({ 
            mensaje: "Archivo guardado y listado exitosamente", 
            trabajo: trabajoGuardado 
        });

    } catch (error) {
        // Manejo de errores y limpieza de emergencia
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch (e) { /* Falló la limpieza, pero continuamos con el error principal */ }
        }
        console.error("Error al subir trabajo a Appwrite:", error);
        res.status(500).json({ error: "Fallo la subida al servicio de almacenamiento persistente." });
    }
});


// 📌 GET /api/works/admin -> solo admins (SE MANTIENE IGUAL POR SEGURIDAD)
router.get("/works/admin", verificarToken, soloAdmin, (req, res) => {
  res.json({
    mensaje: "Zona exclusiva de administradores 🚀",
    user: req.user,
  });
});

export default router;