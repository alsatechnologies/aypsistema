# 🔍 Cómo Encontrar Environment Variables en Vercel

## 📍 Ubicación Correcta

Las Environment Variables NO están en "Deployment Settings". Están en **Settings** → **Environment Variables**.

## 🗺️ Pasos Detallados

### Paso 1: Ir a Settings
1. En la parte superior de Vercel Dashboard, busca la pestaña **"Settings"**
2. Haz clic en **"Settings"** (no "Deployment Settings")

### Paso 2: Buscar Environment Variables
1. En el menú lateral izquierdo de Settings, busca:
   - **"Environment Variables"** o
   - **"Variables"** o
   - **"Secrets"**

2. Haz clic en esa opción

### Paso 3: Agregar Variable
1. Verás una lista de variables de entorno existentes (si hay)
2. Haz clic en el botón **"Add New"** o **"Add Variable"**
3. Completa:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (pega tu service_role key)
   - **Environment:** Marca todas las casillas:
     - ☑️ Production
     - ☑️ Preview  
     - ☑️ Development
4. Haz clic en **"Save"**

## 🎯 Ubicación Visual

```
Vercel Dashboard
├── Tu Proyecto
    ├── Overview
    ├── Deployments
    ├── Settings ← AQUÍ
        ├── General
        ├── Environment Variables ← AQUÍ ESTÁ
        ├── Domains
        ├── Integrations
        └── ...
```

## 💡 Alternativa: Desde el Menú Lateral

Si no ves "Settings" en las pestañas superiores:

1. Busca en el menú lateral izquierdo
2. Debería estar debajo de "Deployments"
3. Haz clic en **"Settings"**
4. Luego busca **"Environment Variables"** en el submenú

## ⚠️ Si Aún No Lo Encuentras

Puedes acceder directamente a la URL:
```
https://vercel.com/[tu-usuario]/[tu-proyecto]/settings/environment-variables
```

O busca en la barra de búsqueda de Vercel: "Environment Variables"

---

**¿Puedes ver la pestaña "Settings" en la parte superior? Si no, dime qué pestañas ves y te guío mejor.**

