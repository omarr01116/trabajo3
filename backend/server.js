import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import worksRoutes from "./routes/works.js";

dotenv.config();

const app = express();
app.use(express.json());

// 🌍 Configuración de CORS (SOLO para entorno local)
const allowedOrigins = [
    "http://127.0.0.1:5500", // La dirección que usa Live Server o VS Code para el HTML estático
    "http://localhost:5173", // entorno local (Vite o React dev server)
    "http://localhost:3000", // Si el backend se llama a sí mismo o se usa desde su propio dominio
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Permitir peticiones sin 'origin' (como apps postman, curl o peticiones directas del mismo servidor)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("No permitido por CORS. Solo se permiten orígenes locales."));
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