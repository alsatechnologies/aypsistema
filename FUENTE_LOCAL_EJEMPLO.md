# Cómo usar una fuente instalada en tu computadora

## Paso 1: Encontrar el nombre exacto de la fuente

Para usar una fuente local, necesitas saber su nombre exacto. Puedes encontrarlo de estas formas:

### En macOS:
1. Abre **Font Book** (Libro de fuentes)
2. Busca tu fuente
3. Haz doble clic para ver los detalles
4. El nombre que aparece es el que debes usar

### En Windows:
1. Abre el **Panel de Control** → **Fuentes**
2. Busca tu fuente
3. Haz clic derecho → **Ver detalles**
4. El nombre que aparece es el que debes usar

## Paso 2: Agregar la fuente al CSS

Tienes dos opciones:

### Opción A: Usar @font-face con local()

Agrega esto en `src/index.css` ANTES de `@tailwind base`:

```css
@font-face {
  font-family: 'Mi Fuente Local';
  src: local('Nombre Exacto de la Fuente'),
       local('Nombre-Alternativo');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Mi Fuente Local';
  src: local('Nombre Exacto de la Fuente Bold'),
       local('Nombre-Alternativo-Bold');
  font-weight: 700;
  font-style: normal;
}
```

Luego actualiza el `body`:

```css
body {
  font-family: 'Mi Fuente Local', 'Inter', sans-serif;
}
```

### Opción B: Usar directamente el nombre (más simple)

Si el navegador puede encontrar la fuente automáticamente, simplemente usa su nombre:

```css
body {
  font-family: 'Nombre Exacto de la Fuente', 'Inter', sans-serif;
}
```

## Ejemplo práctico

Si tu fuente se llama "Roboto Mono" (instalada en el sistema):

```css
@font-face {
  font-family: 'Roboto Mono Local';
  src: local('Roboto Mono'),
       local('RobotoMono-Regular');
  font-weight: 400;
}

body {
  font-family: 'Roboto Mono Local', 'Inter', sans-serif;
}
```

## Nota importante

⚠️ **Para producción**: Las fuentes locales solo funcionan en tu computadora. Para que otros usuarios vean la fuente, necesitas:
- Subir los archivos de fuente al proyecto, o
- Usar un servicio como Google Fonts, o
- Usar un paquete npm como Fontsource

