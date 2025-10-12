// /backend/server.js (SOLUCIÓN DEFINITIVA Y LIMPIA)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import worksRoutes from "./routes/works.js";

dotenv.config(); // ✅ Carga las variables de entorno (.env)

// 🧠 Crear aplicación Express
const app = express();

// 🧩 Middleware para parsear JSON
app.use(express.json());

// 🌍 Configuración de CORS
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://omarr01116.github.io" // ✅ Tu frontend en GitHub Pages
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite solicitudes sin 'origin' (como Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS bloqueado para origen: ${origin}`);
        callback(new Error("No permitido por CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 📂 Rutas principales
app.use("/api", authRoutes);
app.use("/api", worksRoutes);

// 🧭 Ruta de prueba raíz
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend activo y funcionando correctamente en Render + Appwrite + Supabase.",
    status: "OK",
  });
});

// 🚀 Inicializar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose correctamente en el puerto ${PORT}`);
  console.log(`🌐 Permitido acceso desde: ${allowedOrigins.join(", ")}`);
});
