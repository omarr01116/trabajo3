// /backend/routes/works.js
// ======================================================================
// 🧩 Importaciones principales
// ======================================================================
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import { storage, databases } from "../appwriteClient.js";
import { createRequire } from "module";

// ⚠️ CORRECCIÓN: carpeta real es 'middleware', no 'middlewares'
import { verificarToken, soloAdmin } from "../middleware/auth.js";

// Carga dinámica (compatibilidad ESM + CommonJS)
const require = createRequire(import.meta.url);
const Appwrite = require("node-appwrite");

// 🧠 Compatibilidad universal para evitar "InputFile is not a constructor"
const { ID } = Appwrite;
const InputFile = Appwrite.InputFile || Appwrite.default?.InputFile;

// Crear router
const router = express.Router();

// ======================================================================
// ⚙️ Configuración de variables de entorno
// ======================================================================
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID;
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID;

if (!DATABASE_ID || !COLLECTION_ID || !BUCKET_ID) {
  console.error("❌ ERROR CRÍTICO: Faltan IDs de recursos de Appwrite en .env.");
}

// ======================================================================
// 🗂 Configuración de MULTER (Render solo permite /tmp)
// ======================================================================
const upload = multer({ dest: "/tmp" });

// ======================================================================
// 📌 GET /api/works → lista pública de trabajos
// ======================================================================
router.get("/works", async (req, res) => {
  try {
    if (!databases) {
      console.error("❌ ERROR: El cliente de Appwrite Databases no está inicializado.");
      return res.status(500).json({ error: "Servicio de base de datos no disponible." });
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    res.json(response.documents);
  } catch (error) {
    console.error("❌ Error al obtener trabajos de Appwrite:", error);
    res.status(500).json({
      error: "No se pudo obtener la lista de trabajos.",
      detail: error.message,
    });
  }
});

// ======================================================================
// 📌 POST /api/works → subir archivo (solo admin)
// ======================================================================
router.post(
  "/works",
  verificarToken,
  soloAdmin,
  upload.single("documento"),
  async (req, res) => {
    let fileToUpload = req.file;

    try {
      const { curso, semana } = req.body;
      if (!fileToUpload) {
        return res.status(400).json({ error: "No se recibió ningún archivo." });
      }

      const fileName = fileToUpload.originalname;
      const filePath = fileToUpload.path;

      console.log("📂 Subiendo archivo con nombre:", fileName);

      // ✅ CORRECCIÓN DEFINITIVA — SDK moderno usa método estático, no constructor
      const inputFile = InputFile.fromPath(filePath, fileName);

      // Subida al bucket de Appwrite
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        inputFile
      );

      console.log("✅ Archivo subido correctamente a Appwrite:", uploadedFile.$id);

      // Limpieza del archivo temporal
      await fs.unlink(filePath);
      console.log(`🧹 Archivo temporal ${filePath} eliminado tras subida.`);

      // Crear URL pública de visualización
      const fileUrl = `${storage.client.config.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${storage.client.config.project}`;

      // Guardar referencia en la base de datos
      const nuevoTrabajoData = {
        curso,
        semana,
        fileId: uploadedFile.$id,
        fileName,
        fileUrl,
      };

      const trabajoGuardado = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        nuevoTrabajoData
      );

      res.status(201).json({
        mensaje: "✅ Archivo subido y guardado correctamente",
        trabajo: trabajoGuardado,
      });
    } catch (error) {
      // Limpieza si falla algo
      if (fileToUpload && fileToUpload.path) {
        try {
          await fs.unlink(fileToUpload.path);
          console.log(`🧹 Archivo temporal ${fileToUpload.path} eliminado tras error.`);
        } catch (e) {
          console.error("Error al eliminar el archivo temporal:", e);
        }
      }

      console.error("❌ Error al subir trabajo a Appwrite:", error);
      res.status(500).json({
        error: `Fallo la subida del archivo. Detalle: ${error.message}`,
      });
    }
  }
);

// ======================================================================
// 📌 PUT /api/works/:recordId → Renombrar (solo admin)
// ======================================================================
router.put(
  "/works/:recordId",
  verificarToken,
  soloAdmin,
  async (req, res) => {
    const { recordId } = req.params;
    const { nuevoNombre } = req.body;

    if (!nuevoNombre) {
      return res.status(400).json({ error: "El nuevo nombre es requerido." });
    }

    try {
      const updatedTrabajo = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        recordId,
        { fileName: nuevoNombre }
      );

      res.status(200).json({
        mensaje: "Nombre de archivo actualizado correctamente",
        trabajo: updatedTrabajo,
      });
    } catch (error) {
      console.error("❌ Error al renombrar documento:", error);
      res.status(500).json({
        error: "Fallo al renombrar el documento.",
        detail: error.message,
      });
    }
  }
);

// ======================================================================
// 📌 DELETE /api/works/:recordId → Eliminar registro y archivo (solo admin)
// ======================================================================
router.delete(
  "/works/:recordId",
  verificarToken,
  soloAdmin,
  async (req, res) => {
    const { recordId } = req.params;
    const { fileId } = req.query;

    if (!recordId || !fileId) {
      return res
        .status(400)
        .json({ error: "Faltan ID de registro o ID de archivo." });
    }

    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      console.log(`✅ Archivo ${fileId} eliminado de Storage.`);

      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, recordId);
      console.log(`✅ Documento ${recordId} eliminado de la base de datos.`);

      res.status(200).json({
        mensaje: "Registro y archivo eliminados correctamente.",
      });
    } catch (error) {
      console.error("❌ Error al eliminar el trabajo:", error);
      res.status(500).json({
        error: "Fallo al eliminar el trabajo.",
        detail: error.message,
      });
    }
  }
);

// ======================================================================
// 📌 GET /api/works/admin → solo admins
// ======================================================================
router.get("/works/admin", verificarToken, soloAdmin, (req, res) => {
  res.json({
    mensaje: "Zona exclusiva de administradores 🚀",
    user: req.user,
  });
});

export default router;
