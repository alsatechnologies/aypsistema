# 🖼️ GUÍA: Optimización de Imágenes

## 📋 Descripción
Las imágenes sin optimizar pueden hacer que la aplicación cargue lentamente. Esta guía explica cómo optimizarlas.

## 🎯 Objetivo
Reducir el tamaño de las imágenes manteniendo la calidad visual.

## 📁 Imágenes Actuales

Las imágenes están en:
- `public/lovable-uploads/logo ap 2.0.png`
- `public/lovable-uploads/logo_ap.png`
- `public/lovable-uploads/3c1c4838-e91d-4e30-b0a0-fe9cf1466719.png`

## 🛠️ Opción 1: Usar Herramientas Online (Rápido)

### Para PNG/JPG:
1. Ir a: https://tinypng.com/ o https://squoosh.app/
2. Subir la imagen
3. Descargar la versión optimizada
4. Reemplazar el archivo original

### Para convertir a WebP:
1. Ir a: https://squoosh.app/
2. Subir la imagen
3. Seleccionar formato "WebP"
4. Ajustar calidad (80-90 es recomendado)
5. Descargar y guardar como `.webp`

## 🛠️ Opción 2: Usar Scripts (Automático)

### Instalar herramientas (una vez):
```bash
# ImageMagick (para conversión)
brew install imagemagick  # macOS
# o descargar desde: https://imagemagick.org/

# O usar sharp (Node.js)
npm install -g sharp-cli
```

### Script de optimización (crear `scripts/optimize-images.sh`):
```bash
#!/bin/bash

# Optimizar imágenes PNG
for img in public/lovable-uploads/*.png; do
  if [ -f "$img" ]; then
    echo "Optimizando: $img"
    # Reducir tamaño manteniendo calidad
    magick "$img" -strip -quality 85 "$img"
    # O convertir a WebP
    # magick "$img" -quality 85 "${img%.png}.webp"
  fi
done

echo "✅ Optimización completada"
```

## 📊 Resultados Esperados

| Imagen Original | Tamaño Original | Tamaño Optimizado | Reducción |
|----------------|-----------------|-------------------|-----------|
| logo ap 2.0.png | ~500KB | ~50KB | 90% |
| logo_ap.png | ~300KB | ~30KB | 90% |

## 🔄 Actualizar Código para Usar WebP

Si conviertes a WebP, actualiza las referencias:

```typescript
// Antes
<img src="/lovable-uploads/logo_ap.png" />

// Después (con fallback)
<picture>
  <source srcset="/lovable-uploads/logo_ap.webp" type="image/webp" />
  <img src="/lovable-uploads/logo_ap.png" alt="Logo" />
</picture>
```

## ⚡ Mejoras Adicionales

### Lazy Loading de Imágenes
```typescript
<img 
  src="/lovable-uploads/logo_ap.png" 
  loading="lazy" 
  alt="Logo" 
/>
```

### Usar Next.js Image (si migras a Next.js)
```typescript
import Image from 'next/image';

<Image 
  src="/lovable-uploads/logo_ap.png"
  width={200}
  height={100}
  alt="Logo"
  priority={false} // Lazy load
/>
```

## 📝 Checklist

- [ ] Optimizar logo ap 2.0.png
- [ ] Optimizar logo_ap.png
- [ ] Optimizar otras imágenes si existen
- [ ] Verificar que las imágenes se ven bien después de optimizar
- [ ] Actualizar referencias si se cambió a WebP

---

**Nota**: Las imágenes optimizadas deben mantener la calidad visual suficiente para impresión si se usan en tickets.

