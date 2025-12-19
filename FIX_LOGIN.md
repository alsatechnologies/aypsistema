# Fix de Login - Sincronizar Usuario Administrador

## Problema
El usuario administrador existe en la tabla `usuarios` pero no en `auth.users` de Supabase, causando que el login falle.

## Solución

### Opción 1: Ejecutar desde el navegador (Recomendado)

1. Espera 1-2 minutos después del despliegue para que el endpoint esté disponible
2. Abre la consola del navegador (F12)
3. Ejecuta este comando:

```javascript
fetch('https://aypsistema.vercel.app/api/fix-admin-auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    password: 'Admin123' // O la contraseña que quieras usar
  })
})
.then(r => r.json())
.then(data => {
  console.log('Resultado:', data);
  if (data.success) {
    alert('✅ Usuario administrador sincronizado correctamente. Ahora puedes iniciar sesión.');
  } else {
    alert('❌ Error: ' + data.error);
  }
})
.catch(err => {
  console.error('Error:', err);
  alert('❌ Error al ejecutar fix: ' + err.message);
});
```

### Opción 2: Ejecutar desde terminal (curl)

```bash
curl -X POST https://aypsistema.vercel.app/api/fix-admin-auth \
  -H "Content-Type: application/json" \
  -d '{"password": "Admin123"}'
```

## Verificación

Después de ejecutar el fix:
1. Intenta iniciar sesión con:
   - Usuario: `administrador`
   - Contraseña: `Admin123` (o la que especificaste)

## Nota

Este endpoint:
- Verifica si el usuario administrador existe en `auth.users`
- Si existe, actualiza la contraseña
- Si no existe, lo crea con la contraseña especificada
- Sincroniza los datos de la tabla `usuarios` con `auth.users`

