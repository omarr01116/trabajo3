// /backend/server.js (SOLUCIÓN DEFINITIVA)

import express from "express";
import cors from "cors";
import dotenv from "dotenv"; // ⬅️ ¡ESTA LÍNEA ES VITAL!
import authRoutes from "./routes/auth.js";
import worksRoutes from "./routes/works.js";

dotenv.config(); // Ahora Node.js sabe qué es 'dotenv'

const app = express();
app.use(express.json());

// 🌍 Configuración de CORS
const allowedOrigins = [
    "http://127.0.0.1:5500", 
    "http://localhost:5173", 
    "http://localhost:3000", 
    // 🎯 Agregada para tu frontend de GitHub Pages
    "https://omarr01116.github.io" 
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("No permitido por CORS."));
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

// 🧠 Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Backend con Node y Supabase funcionando LOCALMENTE en el puerto 3000.",
    });
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor backend escuchando LOCALMENTE en http://localhost:${PORT}`);
});