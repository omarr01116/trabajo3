import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Las variables se obtienen de tu archivo .env
const supabaseUrl = process.env.SUPABASE_URL;
// ⭐ CORRECCIÓN: Usamos SUPABASE_KEY tal como lo tienes en tu .env
const supabaseKey = process.env.SUPABASE_KEY; 

// Inicialización del cliente de Supabase para el backend
// El { auth: { persistSession: false } } evita que el servidor
// intente mantener una sesión de usuario, ya que solo debe usar la service_role key.
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
    },
});

// Nota: Esta instancia de 'supabase' con la Royale Key 
// es la que se importa en routes/auth.js para verificar tokens y roles.