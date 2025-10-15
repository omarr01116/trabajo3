// backend/routes/files.js
import express from "express";
import { storage } from "../appwriteClient.js";

const router = express.Router();

router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!process.env.APPWRITE_BUCKET_ID) {
      console.error("❌ APPWRITE_BUCKET_ID no está definido en las variables de entorno.");
      return res.status(500).json({ error: "Configuración de servidor incorrecta" });
    }

    // 🔹 Obtener información del archivo (nombre real y MIME)
    const fileInfo = await storage.getFile({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId,
    });

    const fileName = fileInfo.name || fileId;
    const contentType = fileInfo.mimeType || "application/octet-stream";

    // 🔹 Descargar el archivo
    const fileData = await storage.getFileDownload({
      bucketId: process.env.APPWRITE_BUCKET_ID,
      fileId,
    });

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🔹 Enviar archivo al frontend
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);

  } catch (err) {
    console.error("Error al obtener archivo:", err);
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

export default router;
