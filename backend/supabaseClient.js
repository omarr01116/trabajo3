import { createClient } from "@supabase/supabase-js";

// Backend usa variables de entorno normales
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Crear cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
