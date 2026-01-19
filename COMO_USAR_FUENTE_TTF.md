# Cómo usar un archivo TTF en el proyecto

## Pasos:

### 1. Copiar el archivo TTF
Copia tu archivo `.ttf` a la carpeta:
```
public/fonts/tu-fuente.ttf
```

### 2. Agregar @font-face en CSS
En `src/index.css`, agrega ANTES de `@tailwind base`:

```css
@font-face {
  font-family: 'Nombre de tu Fuente';
  src: url('/fonts/tu-fuente.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* Mejora el rendimiento */
}

/* Si tienes variantes (bold, italic, etc.) */
@font-face {
  font-family: 'Nombre de tu Fuente';
  src: url('/fonts/tu-fuente-bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### 3. Usar la fuente
Actualiza el `body` en `src/index.css`:

```css
body {
  font-family: 'Nombre de tu Fuente', 'Inter', sans-serif;
}
```

## Ejemplo completo:

Si tu archivo se llama `MiFuente.ttf`:

1. **Copiar**: `public/fonts/MiFuente.ttf`
2. **CSS**:
```css
@font-face {
  font-family: 'Mi Fuente';
  src: url('/fonts/MiFuente.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: 'Mi Fuente', 'Inter', sans-serif;
}
```

## Nota:
- Los archivos en `public/` son accesibles desde la raíz con `/`
- Vite servirá automáticamente los archivos de `public/`
- Funciona tanto en desarrollo como en producción

