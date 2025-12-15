# Flujo de Trabajo para Desarrollo Continuo

## 🔄 Proceso de Desarrollo y Despliegue

Una vez que tu proyecto esté en Vercel, el flujo de trabajo es muy simple:

### 1. Desarrollo Local

```bash
# Trabajas en tu máquina local
npm run dev

# Haces tus cambios, pruebas, etc.
# Ejemplo: Agregar un nuevo módulo, modificar componentes, etc.
```

### 2. Commit y Push a Git

```bash
# Agregas tus cambios
git add .

# Haces commit con un mensaje descriptivo
git commit -m "Agregar módulo de Reportes avanzados"

# Subes los cambios a GitHub/GitLab
git push
```

### 3. Despliegue Automático en Vercel

**¡Vercel despliega automáticamente!** 🚀

- Cuando haces `git push` a la rama principal (main/master)
- Vercel detecta el cambio automáticamente
- Inicia un nuevo build
- Despliega la nueva versión
- Te notifica cuando termine (por email o en el dashboard)

**Tiempo estimado:** 2-5 minutos desde el push hasta que esté en producción.

## 📋 Ejemplo Práctico: Agregar un Nuevo Módulo

### Paso 1: Desarrollo Local

```bash
# 1. Crear el nuevo componente/módulo
# Ejemplo: src/pages/NuevoModulo.tsx

# 2. Agregarlo a las rutas en src/App.tsx
<Route path="/nuevo-modulo" element={<NuevoModulo />} />

# 3. Agregarlo al Sidebar si es necesario
# src/components/Sidebar.tsx

# 4. Probar localmente
npm run dev
```

### Paso 2: Verificar que Funciona

```bash
# Asegúrate de que:
# - No hay errores en la consola
# - El build funciona
npm run build

# Si hay errores, corrígelos antes de hacer push
```

### Paso 3: Subir a Producción

```bash
git add .
git commit -m "Agregar módulo de Reportes avanzados"
git push
```

### Paso 4: Verificar en Vercel

1. Ve al dashboard de Vercel
2. Verás un nuevo "Deployment" en proceso
3. Espera a que termine (verás un check verde ✅)
4. Tu cambio ya está en producción

## 🌿 Trabajar con Branches (Ramas)

Para cambios grandes o experimentales, usa branches:

### Crear una Branch para una Feature

```bash
# Crear y cambiar a una nueva rama
git checkout -b feature/nuevo-modulo-reportes

# Trabajar en la feature
# ... hacer cambios ...

# Commit
git add .
git commit -m "WIP: Nuevo módulo de reportes"

# Push de la branch
git push -u origin feature/nuevo-modulo-reportes
```

### Preview Deployments en Vercel

- Vercel crea automáticamente un "Preview Deployment" para cada branch
- Obtienes una URL única para probar antes de mergear
- Ejemplo: `tu-proyecto-git-abc123.vercel.app`
- Perfecto para revisar cambios antes de producción

### Mergear a Producción

```bash
# Cuando estés listo, mergear a main
git checkout main
git merge feature/nuevo-modulo-reportes
git push
```

## 🔍 Verificar Cambios en Producción

Después de cada despliegue:

1. **Revisa el Dashboard de Vercel:**
   - Ve a tu proyecto en Vercel
   - Revisa el último deployment
   - Verifica que el build fue exitoso

2. **Prueba la Aplicación:**
   - Visita tu URL de producción
   - Verifica que los cambios funcionan
   - Revisa la consola del navegador por errores

3. **Revisa los Logs:**
   - En Vercel → Deployments → Click en el deployment
   - Revisa "Build Logs" si hay problemas

## ⚠️ Casos Especiales

### Cambiar Variables de Entorno

Si necesitas cambiar variables de entorno:

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Modifica o agrega las variables
3. **Reinicia el deployment** (o haz un nuevo push)

### Rollback (Revertir a Versión Anterior)

Si algo sale mal:

1. Ve a Vercel Dashboard → Deployments
2. Encuentra el deployment anterior que funcionaba
3. Click en los "..." → "Promote to Production"
4. Vercel restaurará esa versión

### Cambios en Base de Datos (Supabase)

Para cambios en la base de datos:

1. **Crear una migración:**
   ```sql
   -- supabase/migrations/009_nueva_tabla.sql
   CREATE TABLE nueva_tabla (...);
   ```

2. **Aplicar la migración:**
   - Usa el MCP de Supabase en Cursor
   - O aplica manualmente desde Supabase Dashboard

3. **Actualizar el código:**
   - Modifica los servicios/hooks en tu código
   - Commit y push como siempre

## 📝 Checklist para Cada Cambio

Antes de hacer push:

- [ ] El código funciona localmente (`npm run dev`)
- [ ] El build funciona (`npm run build`)
- [ ] No hay errores en la consola
- [ ] Las nuevas dependencias están en `package.json`
- [ ] Las variables de entorno necesarias están documentadas
- [ ] Si hay cambios en DB, las migraciones están listas

## 🚀 Resumen

**Flujo Simple:**
```
Desarrollo Local → git commit → git push → Vercel despliega automáticamente
```

**Tiempo típico:** 5-10 minutos desde que haces push hasta que está en producción.

**No necesitas:**
- Configurar nada manualmente en Vercel
- Hacer deploy manual
- Reiniciar servidores
- Configurar CI/CD (Vercel lo hace automáticamente)

**Solo necesitas:**
- Trabajar en tu código local
- Hacer commit y push
- Vercel hace el resto automáticamente

¡Es así de simple! 🎉


