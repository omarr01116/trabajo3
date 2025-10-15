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

    // Obtén el archivo de Appwrite como stream
    const fileStream = await storage.getFileDownload({
      bucketId: process.env.APPWRITE_BUCKET_ID, // CORREGIDO
      fileId,
    });

    // Configurar headers para enviar archivo al frontend
    res.setHeader("Content-Disposition", `inline; filename="${fileId}"`);
    res.setHeader("Content-Type", fileStream.headers.get("content-type"));

    // Pipe del stream directamente a la respuesta
    fileStream.body.pipe(res);

  } catch (err) {
    console.error("Error al obtener archivo:", err);
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

export default router;
