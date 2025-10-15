// backend/routes/files.js
import express from "express";
import { storage } from "../appwriteClient.js";

const router = express.Router();

router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Obtén el archivo de Appwrite
    const file = await storage.getFileDownload({
      bucketId: process.env.BUCKET_ID,
      fileId,
    });

    // Convertir a buffer para Node.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obtener el nombre original y tipo MIME
    const fileName = file.name || fileId;
    const contentType = file.type || "application/octet-stream";

    // Enviar archivo al frontend
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (err) {
    console.error("Error al obtener archivo:", err);
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

export default router;
