# 🔑 Cómo Obtener tu Service Role Key de Supabase

## 📍 Ubicación en Supabase Dashboard

### Paso 1: Acceder al Dashboard
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (el que estás usando para este sistema)

### Paso 2: Ir a Settings → API
1. En el menú lateral izquierdo, busca **"Settings"** (Configuración) o el ícono de ⚙️
2. Haz clic en **"Settings"**
3. En el submenú, selecciona **"API"**

### Paso 3: Encontrar la Service Role Key
En la página de API verás varias secciones:

#### Sección: **"Project API keys"**

Aquí verás **2 tipos de keys**:

1. **`anon` `public`** (Clave Pública/Anónima)
   - ⚠️ **NO es esta** - Esta es la que ya tienes en tu `.env`
   - Se usa en el frontend
   - Tiene permisos limitados

2. **`service_role` `secret`** (Clave de Servicio/Secreta) ⭐
   - ✅ **ESTA ES LA QUE NECESITAS**
   - Tiene permisos de administrador
   - ⚠️ **NUNCA la expongas públicamente**
   - Solo úsala en scripts del servidor o backend

### Paso 4: Copiar la Service Role Key
1. Busca la fila que dice **"service_role"** y **"secret"**
2. Haz clic en el ícono de **"eye"** (👁️) o **"reveal"** para mostrarla
3. Haz clic en el ícono de **"copy"** (📋) para copiarla
4. **Guárdala en un lugar seguro** (no la compartas públicamente)

## ⚠️ IMPORTANTE: Seguridad

### ✅ Qué Hacer:
- ✅ Úsala solo en scripts del servidor
- ✅ Úsala para operaciones administrativas
- ✅ Guárdala en variables de entorno (nunca en el código)
- ✅ Revócala si se compromete

### ❌ Qué NO Hacer:
- ❌ NUNCA la pongas en el código del frontend
- ❌ NUNCA la subas a GitHub/GitLab
- ❌ NUNCA la compartas públicamente
- ❌ NUNCA la uses en el navegador

## 📋 Ejemplo de Uso Seguro

```bash
# ✅ CORRECTO: Usar variable de entorno
export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
npx ts-node scripts/update_auth_users_emails.ts

# ❌ INCORRECTO: Ponerla en el código
const key = "eyJhbGc..."; // NUNCA hagas esto
```

## 🔍 Ubicación Visual

```
Supabase Dashboard
├── Tu Proyecto
    ├── Settings (⚙️)
        ├── API
            └── Project API keys
                ├── anon public ← NO esta
                └── service_role secret ← ✅ ESTA
```

## 💡 Alternativa: Si No Quieres Usar Service Role Key

Si prefieres no usar la Service Role Key por seguridad, puedes:

1. **Actualizar manualmente desde Dashboard:**
   - Ve a Authentication → Users
   - Edita cada usuario manualmente
   - Cambia el email uno por uno

2. **Usar solo para esta operación:**
   - Úsala solo para actualizar los emails
   - Luego puedes revocarla y crear una nueva si quieres

---

**¿Encontraste la Service Role Key? Una vez que la tengas, puedo ejecutar el script para actualizar los usuarios automáticamente.**

