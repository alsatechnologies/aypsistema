import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que hay una clave secreta para seguridad
  const secretKey = req.headers['x-secret-key'] || req.body?.secretKey;
  const expectedSecret = process.env.MIGRATION_SECRET_KEY;

  if (!expectedSecret || secretKey !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized. Se requiere secretKey válido.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Configuración faltante. Se requieren VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY' 
    });
  }

  // Crear cliente con Service Role Key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // SQL de la migración
    const migrationSQL = `
      -- Crear tabla
      CREATE TABLE IF NOT EXISTS inventario_almacenes (
        id SERIAL PRIMARY KEY,
        almacen_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
        producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        cantidad DECIMAL(15,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(almacen_id, producto_id)
      );

      -- Crear índices
      CREATE INDEX IF NOT EXISTS idx_inventario_almacenes_almacen ON inventario_almacenes(almacen_id);
      CREATE INDEX IF NOT EXISTS idx_inventario_almacenes_producto ON inventario_almacenes(producto_id);

      -- Habilitar RLS
      ALTER TABLE inventario_almacenes ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS
      DROP POLICY IF EXISTS "Usuarios autenticados pueden leer inventario" ON inventario_almacenes;
      CREATE POLICY "Usuarios autenticados pueden leer inventario"
        ON inventario_almacenes FOR SELECT TO authenticated USING (true);

      DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar inventario" ON inventario_almacenes;
      CREATE POLICY "Usuarios autenticados pueden insertar inventario"
        ON inventario_almacenes FOR INSERT TO authenticated WITH CHECK (true);

      DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar inventario" ON inventario_almacenes;
      CREATE POLICY "Usuarios autenticados pueden actualizar inventario"
        ON inventario_almacenes FOR UPDATE TO authenticated USING (true);

      DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar inventario" ON inventario_almacenes;
      CREATE POLICY "Usuarios autenticados pueden eliminar inventario"
        ON inventario_almacenes FOR DELETE TO authenticated USING (true);
    `;

    // Ejecutar usando rpc o directamente
    // Nota: Supabase no permite ejecutar SQL arbitrario desde el cliente
    // Necesitamos usar el SQL Editor del dashboard o crear funciones SQL
    
    return res.status(200).json({ 
      success: true,
      message: '⚠️ No se puede ejecutar SQL arbitrario desde el cliente de Supabase por seguridad.',
      instruction: 'Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase Dashboard.',
      sql: migrationSQL
    });

  } catch (error: any) {
    console.error('Error ejecutando migración:', error);
    return res.status(500).json({ 
      error: 'Error ejecutando migración',
      message: error.message 
    });
  }
}

