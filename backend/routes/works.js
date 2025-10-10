import express from "express";
import { verificarToken, soloAdmin } from "../middleware/auth.js";

const router = express.Router();

// 🚀 Por ahora seguimos con array simulado
const trabajos = [];

// 📌 GET /api/works -> lista de trabajos (público)
router.get("/works", (req, res) => {
  res.json(trabajos);
});

// 📌 POST /api/works -> subir nuevo trabajo (solo admin)
router.post("/works", verificarToken, soloAdmin, (req, res) => {
  const { titulo, descripcion, archivo } = req.body;

  if (!titulo || !archivo) {
    return res.status(400).json({ error: "Título y archivo son requeridos" });
  }

  const nuevoTrabajo = {
    id: trabajos.length + 1,
    titulo,
    descripcion,
    archivo,
    creadoPor: req.user.email, // ✅ viene del middleware (Supabase)
    role: req.user.role,       // ✅ rol del usuario
  };

  trabajos.push(nuevoTrabajo);
  res.json({ mensaje: "Trabajo agregado", trabajo: nuevoTrabajo });
});

// 📌 GET /api/works/admin -> solo admins
router.get("/works/admin", verificarToken, soloAdmin, (req, res) => {
  res.json({
    mensaje: "Zona exclusiva de administradores 🚀",
    user: req.user,
  });
});

export default router;
