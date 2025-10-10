
// /backend/server.js (CORREGIDO)

import express from "express";
import cors from "cors";
// ... otras importaciones ...

dotenv.config();

const app = express();
app.use(express.json());

// 🌍 Configuración de CORS
const allowedOrigins = [
    "http://127.0.0.1:5500", 
    "http://localhost:5173", 
    "http://localhost:3000", 
    // 🎯 AÑADIR LA URL DE GITHUB PAGES AQUÍ
    "https://omarr01116.github.io" 
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Permite peticiones sin 'origin' (como apps postman, curl o peticiones directas del mismo servidor)
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

// 🚀 Iniciar servidor (Usamos el puerto 3000 por defecto para desarrollo local)
const PORT = process.env.PORT || 3000;

// Escucha solo en el puerto y localhost
app.listen(PORT, () => {
    console.log(`✅ Servidor backend escuchando LOCALMENTE en http://localhost:${PORT}`);
});