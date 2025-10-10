import { supabase } from "../supabaseClient.js";

// Middleware para verificar el token y obtener usuario
export async function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1]; // Formato: "Bearer <token>"

  // Validar token con Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }

  // Consultar perfil del usuario para obtener rol
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    return res.status(500).json({ error: "Error al obtener rol del usuario" });
  }

  // Guardamos usuario + rol en request
  req.user = { ...data.user, role: profile?.role || "usuario" };

  next();
}

// Middleware para restringir solo a administradores
export function soloAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso solo para admin" });
  }

  next();
}
