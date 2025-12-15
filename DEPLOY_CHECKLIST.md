# Checklist de Despliegue en Vercel

## ✅ Pre-requisitos Completados

- [x] Build funciona correctamente (`npm run build`)
- [x] Archivo `vercel.json` creado
- [x] Variables de entorno configuradas en código
- [x] RLS habilitado en Supabase
- [x] `.gitignore` configurado correctamente

## 📋 Pasos para Desplegar en Vercel

### 1. Preparar el Repositorio

```bash
# Asegúrate de que todos los cambios estén commiteados
git add .
git commit -m "Preparación para despliegue"
git push
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub/GitLab
4. Vercel detectará automáticamente que es un proyecto Vite

### 3. Configurar Variables de Entorno en Vercel

**IMPORTANTE:** Debes agregar estas variables en la configuración del proyecto en Vercel:

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

**⚠️ CRÍTICO:** Sin estas variables, la aplicación no funcionará en producción.

### 4. Configuración de Build (Ya está en vercel.json)

Vercel debería detectar automáticamente:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 5. Desplegar

1. Haz clic en "Deploy"
2. Espera a que termine el build
3. Revisa los logs por errores

## 🔍 Verificaciones Post-Despliegue

Después del despliegue, verifica:

- [ ] La aplicación carga correctamente
- [ ] El login funciona
- [ ] Las conexiones a Supabase funcionan
- [ ] No hay errores en la consola del navegador
- [ ] Las rutas protegidas funcionan correctamente

## ⚠️ Notas Importantes

1. **Variables de Entorno:** Asegúrate de que las variables de entorno estén configuradas en Vercel, NO en el código.

2. **CORS en Supabase:** Verifica que en Supabase Dashboard → Settings → API, la URL de tu aplicación en Vercel esté en la lista de URLs permitidas (si es necesario).

3. **Base de Datos:** Tu base de datos en Supabase ya está configurada y lista para producción.

4. **RLS:** Las políticas de RLS están habilitadas. Si encuentras problemas de acceso, revisa las políticas en Supabase.

## 🐛 Solución de Problemas

### Error: "Supabase no está configurado"
- Verifica que las variables de entorno estén configuradas en Vercel
- Reinicia el deployment después de agregar las variables

### Error: "Failed to fetch" o problemas de CORS
- Verifica la configuración de CORS en Supabase
- Asegúrate de que la URL de Vercel esté permitida

### Error: "Row Level Security policy violation"
- Revisa las políticas de RLS en Supabase
- Las políticas actuales permiten acceso completo, pero verifica que estén activas

## 📝 Archivos Importantes

- `vercel.json` - Configuración de Vercel
- `.env.example` - Template de variables de entorno (NO incluye valores reales)
- `.gitignore` - Excluye archivos sensibles

## 🚀 Listo para Desplegar

Tu proyecto está listo para desplegarse en Vercel. Solo necesitas:
1. Conectar el repositorio
2. Agregar las variables de entorno
3. Hacer clic en "Deploy"

¡Buena suerte! 🎉


