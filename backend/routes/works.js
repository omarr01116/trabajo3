// ======================================================================
// /backend/routes/works.js (VERSIÓN FINAL CORREGIDA Y FUNCIONAL)
// ======================================================================

import express from "express";
import { verificarToken, soloAdmin } from "../middleware/auth.js";
import multer from "multer";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { storage, databases } from "../appwriteClient.js";
import { ID } from "node-appwrite";

const router = express.Router();

// 🧭 CONFIGURACIÓN DE APPWRITE
const DATABASE_ID = "68ebd97b002ffc08ca90";
const COLLECTION_ID = "trabajodocs";
const BUCKET_ID = "68ebd7b1000a707b10f2";

// 🗂 CONFIGURACIÓN DE MULTER (Render solo permite /tmp)
const upload = multer({ dest: "/tmp" });

// ======================================================================
// 📌 GET /api/works → lista pública de trabajos
// ======================================================================
router.get("/works", async (req, res) => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    res.json(response.documents);
  } catch (error) {
    console.error("Error al obtener trabajos:", error);
    res.status(500).json({ error: "No se pudo obtener la lista de trabajos." });
  }
});

// ======================================================================
// 📌 POST /api/works → subir archivo (solo admin)
// Guardará el archivo como: curso/semana/nombreArchivo.pdf
// ======================================================================
router.post(
  "/works",
  verificarToken,
  soloAdmin,
  upload.single("documento"),
  async (req, res) => {
    try {
      const { ruta } = req.body;
      const fileToUpload = req.file;

      if (!ruta || !fileToUpload) {
        return res.status(400).json({
          error: "Ruta y Archivo (documento) son requeridos",
        });
      }

      // ✅ Extrae curso y semana desde la ruta: curso/semana/nombreArchivo
      const parts = ruta.split("/");
      const curso = parts[0] || "SinCurso";
      const semana = parts[1] || "SinSemana";
      const fileName = fileToUpload.originalname;

      // ✅ Construye la ruta limpia
      const customFileName = `${curso}/${semana}/${fileName}`;
      console.log("📂 Subiendo a ruta lógica:", customFileName);

      // --- 1️⃣ Subir archivo a Appwrite Storage ---
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        fsSync.createReadStream(fileToUpload.path)
      );

      // --- 2️⃣ Eliminar archivo temporal ---
      await fs.unlink(fileToUpload.path);

      // --- 3️⃣ Crear URL pública para vista directa ---
      const fileUrl = `${storage.client.config.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${storage.client.config.project}`;

      // --- 4️⃣ Guardar referencia en base de datos ---
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
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (e) {}
      }
      console.error("❌ Error al subir trabajo a Appwrite:", error);
      res.status(500).json({ error: "Fallo la subida del archivo." });
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
