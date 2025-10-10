import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// POST /api/login usando token del frontend
router.post("/login", async (req, res) => {
    
    let userRole = 'usuario'; // Inicializamos con el rol por defecto
    
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ error: "Token requerido" });
        }

        const token = authHeader.split(" ")[1]; // "Bearer <token>"

        // 1. Validar token con Supabase (usando Service Role Key)
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(403).json({ error: "Token inválido o expirado" });
        }

        // 2. Intentar Obtener rol desde tabla profiles
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        // 🚨 Manejo de la Lógica de Primer Login y Roles 🚨
        if (profileError) {
            // El código 'PGRST116' significa: "No se encontró ninguna fila para single()".
            if (profileError.code === 'PGRST116') {
                
                // 3. ACCIÓN: INSERCIÓN DEL PERFIL CON ROL POR DEFECTO
                console.log(`Usuario ${data.user.id} no tiene perfil. Creando con rol 'usuario'.`);
                
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({ 
                        id: data.user.id, 
                        email: data.user.email,
                        role: 'usuario' // 👈 Rol asignado por defecto
                    });

                if (insertError) {
                    console.error("⛔ Error al crear perfil:", insertError);
                    return res.status(500).json({ error: "Error al crear perfil de usuario inicial en BDD." });
                }
                
                // Si la inserción fue exitosa, el rol se mantiene en 'usuario'.
                userRole = 'usuario'; 

            } else {
                // Si es otro error (conexión, tabla mal nombrada), devolvemos el 500.
                console.error("⛔ Error grave en BDD al obtener perfil:", profileError);
                return res.status(500).json({ error: "Error grave en la base de datos al obtener el rol" });
            }
        } else {
            // Si el perfil SÍ fue encontrado, usamos su rol
            userRole = profile.role;
        }

        // 4. Respuesta Final Exitosa
        res.json({
            token,
            role: userRole.trim().toLowerCase() || "usuario", 
            user: { id: data.user.id, email: data.user.email },
        });

    } catch (err) {
        // Captura de errores inesperados
        console.error("⛔ Error inesperado en el servidor:", err);
        // ⭐ CAMBIO AQUÍ: Mensaje genérico para cualquier entorno.
        res.status(500).json({ error: "Error interno del servidor. Revisar logs del backend." });
    }
});

export default router;