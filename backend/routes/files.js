// backend/routes/files.js
import express from "express";
import { storage } from "../appwriteClient.js"; // Asegúrate que la importación sea correcta

const router = express.Router();

router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // 1. Verificación de la variable de entorno
    if (!process.env.APPWRITE_BUCKET_ID) {
      console.error("❌ APPWRITE_BUCKET_ID no está definido en las variables de entorno.");
      return res.status(500).json({ error: "Configuración de servidor incorrecta" });
    }

    // 2. Obtener metadatos del archivo (nombre y tipo MIME)
    const fileInfo = await storage.getFile({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId,
    });

    const fileName = fileInfo.name || fileId;
    const contentType = fileInfo.mimeType || "application/octet-stream";

    // 3. 🔹 CORRECCIÓN CLAVE: Descargar el archivo
    // La función getFileDownload en el SDK de Node ya devuelve un Buffer.
    // No se necesita .arrayBuffer() ni Buffer.from().
    const buffer = await storage.getFileDownload({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId,
    });

    // 4. Enviar el buffer del archivo directamente al frontend
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);

  } catch (err) {
    console.error("Error al obtener archivo:", err);
    res.status(404).json({ error: "Archivo no encontrado o error en el servidor." });
  }
});

export default router;