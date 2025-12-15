# Configuración de Supabase con MCP

## Pasos completados ✅

1. ✅ Creado archivo `src/lib/supabase.ts` - Cliente de Supabase
2. ✅ Actualizado `.gitignore` para excluir archivos `.env`
3. ✅ Creado archivo `.env.example` como referencia

## Pasos pendientes

### 1. Instalar dependencia de Supabase

Ejecuta uno de estos comandos:

```bash
npm install @supabase/supabase-js
```

o si usas bun:

```bash
bun add @supabase/supabase-js
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_SUPABASE_URL=https://higgudeoopxwcvdrhudl.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

**Para obtener tus credenciales:**
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Configurar MCP en Cursor

Para que Cursor pueda usar Supabase mediante MCP, necesitas configurar el archivo de MCP:

**Ubicación del archivo:** `~/.cursor/mcp.json` (en tu directorio home)

**Contenido del archivo:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=higgudeoopxwcvdrhudl"
    }
  }
}
```

**Alternativa:** Si tienes acceso a la página de configuración de MCP en Supabase, puedes usar el botón "Add to Cursor" que configura esto automáticamente.

### 4. Reiniciar Cursor

Después de configurar MCP, reinicia Cursor para que cargue la nueva configuración.

## Uso del cliente de Supabase

Una vez configurado, puedes importar y usar el cliente de Supabase en cualquier componente:

```typescript
import { supabase } from '@/lib/supabase'

// Ejemplo de uso
const { data, error } = await supabase
  .from('tu_tabla')
  .select('*')
```

## Verificación

Para verificar que todo está funcionando:

1. ✅ El archivo `src/lib/supabase.ts` existe
2. ✅ El archivo `.env` tiene tus credenciales
3. ✅ La dependencia `@supabase/supabase-js` está instalada
4. ✅ El archivo `~/.cursor/mcp.json` está configurado
5. ✅ Cursor ha sido reiniciado

## Notas importantes

- ⚠️ **Nunca commitees el archivo `.env`** - Ya está en `.gitignore`
- ⚠️ **MCP es para desarrollo** - No uses MCP con datos de producción
- ✅ El archivo `.env.example` puede ser commiteado como referencia

## Próximos pasos

Una vez configurado, puedes:
- Usar comandos en Cursor como "Crea una tabla de usuarios en Supabase"
- Consultar datos directamente desde Cursor
- Generar tipos de TypeScript desde tu esquema de Supabase
- Ejecutar migraciones y consultas SQL



