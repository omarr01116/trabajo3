import express from "express";
import { storage } from "../appwriteClient.js";

const router = express.Router();

router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Obtén el archivo de Appwrite
    const fileStream = await storage.getFileDownload({
      bucketId: process.env.BUCKET_ID,
      fileId,
    });

    // Devuelve el archivo al frontend
    res.setHeader("Content-Disposition", `inline; filename="${fileId}"`);
    res.setHeader("Content-Type", fileStream.headers.get("content-type"));
    fileStream.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el archivo" });
  }
});

export default router;
