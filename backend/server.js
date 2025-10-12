// /backend/server.js (VERSIÓN LIMPIA Y OPTIMIZADA)
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
    origin: (origin, callback) => {
      // Permite solicitudes sin 'origin' (Postman, fetch desde backend)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS bloqueado para origen: ${origin}`);
        callback(null, false); // No rompe el servidor
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

// 🌐 Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 🚀 Inicializar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`🌐 Permitido acceso desde: ${allowedOrigins.join(", ")}`);
});
