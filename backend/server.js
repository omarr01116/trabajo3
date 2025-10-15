// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import worksRouter from "./routes/works.js"; // Importa tu router de trabajos
import authRouter from "./routes/auth.js";   // Importa tu router de autenticación
import filesRouter from "./routes/files.js";

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =======================================================
// 🔹 Middlewares Esenciales
// =======================================================

// 1. Habilitar CORS para permitir peticiones desde tu frontend.
app.use(cors());

// 2. Middlewares para analizar cuerpos de solicitud.
//    Estos deben ir ANTES de las rutas.
app.use(express.json()); // Para analizar cuerpos JSON
app.use(express.urlencoded({ extended: true })); // Para analizar cuerpos URL-encoded

// =======================================================
// 🔹 Montaje de Rutas
// =======================================================

// 3. Montar los routers. Todas las rutas definidas en
//    works.js y auth.js comenzarán con /api.
app.use("/api", worksRouter);
app.use("/api", authRouter);
app.use("/api/files", filesRouter);
// Ruta de bienvenida para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("🚀 El servidor del backend está operativo.");
});

// =======================================================
// 🔹 Iniciar el Servidor
// =======================================================
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
});