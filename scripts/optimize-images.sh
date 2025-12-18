#!/bin/bash

# Script para optimizar imágenes del proyecto
# Requiere ImageMagick: brew install imagemagick

echo "🖼️  Optimizando imágenes..."

# Directorio de imágenes
IMAGE_DIR="public/lovable-uploads"

# Verificar si ImageMagick está instalado
if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick no está instalado."
    echo "   Instala con: brew install imagemagick"
    echo "   O usa herramientas online: https://tinypng.com/"
    exit 1
fi

# Crear backup
BACKUP_DIR="${IMAGE_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
if [ -d "$IMAGE_DIR" ]; then
    echo "📦 Creando backup en: $BACKUP_DIR"
    cp -r "$IMAGE_DIR" "$BACKUP_DIR"
fi

# Optimizar PNG
for img in "$IMAGE_DIR"/*.png; do
    if [ -f "$img" ]; then
        echo "  Optimizando: $(basename "$img")"
        # Reducir tamaño manteniendo calidad (85%)
        magick "$img" -strip -quality 85 "$img"
    fi
done

# Optimizar JPG
for img in "$IMAGE_DIR"/*.jpg "$IMAGE_DIR"/*.jpeg; do
    if [ -f "$img" ]; then
        echo "  Optimizando: $(basename "$img")"
        magick "$img" -strip -quality 85 "$img"
    fi
done

echo "✅ Optimización completada"
echo "   Backup guardado en: $BACKUP_DIR"

