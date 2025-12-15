# 🚀 Guía Paso a Paso: Desplegar en Vercel

## 📋 Pre-requisitos

- [x] Tener una cuenta en [Vercel](https://vercel.com) (gratis)
- [x] Tener tu proyecto en GitHub, GitLab o Bitbucket
- [x] Tener las credenciales de Supabase listas

---

## Paso 1: Preparar el Repositorio

### 1.1 Verificar que todo esté commiteado

```bash
# Ver el estado de tus archivos
git status

# Si hay cambios sin commitear, agrégalos
git add .
git commit -m "Preparación para despliegue en Vercel"
```

### 1.2 Subir a GitHub/GitLab (si no lo has hecho)

```bash
# Si es la primera vez, crea el repositorio en GitHub primero
# Luego:
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git branch -M main
git push -u origin main

# Si ya tienes el repositorio remoto:
git push
```

---

## Paso 2: Crear Cuenta/Iniciar Sesión en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** o **"Log In"**
3. **Recomendado:** Inicia sesión con GitHub (más fácil para conectar repositorios)

---

## Paso 3: Importar Proyecto en Vercel

### 3.1 Agregar Nuevo Proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Si conectaste GitHub, verás tus repositorios
3. Busca y selecciona tu proyecto: **"ayp101225"** (o el nombre que tenga)

### 3.2 Configuración del Proyecto

Vercel detectará automáticamente que es un proyecto Vite. Verás algo como:

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**✅ Deja estos valores como están** (ya están configurados en `vercel.json`)

---

## Paso 4: Configurar Variables de Entorno ⚠️ CRÍTICO

### 4.1 Agregar Variables

Antes de hacer clic en "Deploy", **DEBES agregar las variables de entorno:**

1. En la sección **"Environment Variables"**, haz clic en **"Add"** o el botón **"+ Add"**

2. Agrega la primera variable:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Tu URL de Supabase (ejemplo: `https://higgudeoopxwcvdrhudl.supabase.co`)
   - **Environment:** Selecciona todas (Production, Preview, Development)

3. Haz clic en **"Add"** o **"Add Another"**

4. Agrega la segunda variable:
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Tu clave anónima de Supabase
   - **Environment:** Selecciona todas (Production, Preview, Development)

### 4.2 Obtener Credenciales de Supabase

Si no las tienes:

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `image.pngVITE_SUPABASE_ANON_KEY`

---

## Paso 5: Desplegar

### 5.1 Iniciar Deployment

1. Verifica que las variables de entorno estén agregadas
2. Haz clic en el botón **"Deploy"** (abajo a la derecha)

### 5.2 Esperar el Build

- Verás el progreso del build en tiempo real
- Tiempo estimado: 2-5 minutos
- No cierres la pestaña

### 5.3 Verificar el Resultado

Cuando termine, verás:
- ✅ **"Ready"** en verde = ¡Éxito!
- ❌ **"Error"** en rojo = Revisa los logs

---

## Paso 6: Verificar el Despliegue

### 6.1 Probar la Aplicación

1. Vercel te dará una URL automática, ejemplo:
   ```
   https://tu-proyecto.vercel.app
   ```

2. Haz clic en la URL o cópiala y ábrela en el navegador

3. Verifica que:
   - [ ] La página carga correctamente
   - [ ] El login funciona
   - [ ] Puedes navegar entre módulos
   - [ ] No hay errores en la consola del navegador (F12)

### 6.2 Revisar Logs (si hay problemas)

1. En Vercel Dashboard → Tu proyecto → **Deployments**
2. Haz clic en el último deployment
3. Revisa **"Build Logs"** para ver errores

---

## Paso 7: Configurar Dominio Personalizado (Opcional)

Si quieres usar tu propio dominio:

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio (ejemplo: `app.tudominio.com`)
3. Sigue las instrucciones de Vercel para configurar DNS

---

## 🔧 Solución de Problemas Comunes

### Error: "Supabase no está configurado"

**Causa:** Variables de entorno no configuradas o incorrectas

**Solución:**
1. Ve a **Settings** → **Environment Variables**
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén agregadas
3. Reinicia el deployment (haz un nuevo push o "Redeploy")

### Error: "Build failed"

**Causa:** Error en el código o dependencias

**Solución:**
1. Revisa los "Build Logs" en Vercel
2. Prueba el build localmente: `npm run build`
3. Corrige los errores y haz push nuevamente

### Error: "Failed to fetch" o CORS

**Causa:** Problemas de CORS con Supabase

**Solución:**
1. Ve a Supabase Dashboard → **Settings** → **API**
2. En "CORS", agrega tu URL de Vercel
3. O usa `*` temporalmente para desarrollo (no recomendado en producción)

### La aplicación carga pero no funciona

**Causa:** Variables de entorno no se cargaron correctamente

**Solución:**
1. Verifica en Vercel que las variables estén en "Production"
2. Reinicia el deployment
3. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Proyecto desplegado sin errores
- [ ] Variables de entorno configuradas
- [ ] La aplicación carga correctamente
- [ ] El login funciona
- [ ] Puedes crear/editar datos
- [ ] Las conexiones a Supabase funcionan
- [ ] No hay errores en la consola del navegador

---

## 🎉 ¡Listo!

Tu aplicación está en producción. Cada vez que hagas `git push`, Vercel desplegará automáticamente los cambios.

**URL de tu aplicación:** `https://tu-proyecto.vercel.app`

---

## 📝 Notas Importantes

1. **Variables de Entorno:** Nunca las subas al código. Siempre úsalas en Vercel.

2. **Build Automático:** Cada push a `main` despliega automáticamente.

3. **Preview Deployments:** Cada branch tiene su propia URL para probar.

4. **Rollback:** Puedes volver a versiones anteriores desde el dashboard de Vercel.

---

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Revisa los logs en Vercel
2. Verifica la consola del navegador (F12)
3. Prueba el build localmente: `npm run build`
4. Revisa que las variables de entorno estén correctas

¡Buena suerte con tu despliegue! 🚀


