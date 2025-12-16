#!/bin/bash

# Script para establecer contraseña del administrador
# Uso: ./scripts/set_admin_password.sh

echo "🔐 Estableciendo contraseña para admin@test.com..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Necesitas configurar las variables de entorno:"
    echo "   export SUPABASE_URL='https://tu-proyecto.supabase.co'"
    echo "   export SUPABASE_SERVICE_ROLE_KEY='tu_service_role_key'"
    exit 1
fi

# Email y contraseña
EMAIL="admin@test.com"
PASSWORD="Admin123"

echo "📧 Email: $EMAIL"
echo "🔑 Contraseña: $PASSWORD"
echo ""

# Usar curl para llamar a la API de Supabase
USER_ID=$(curl -s -X GET \
  "$SUPABASE_URL/auth/v1/admin/users?email=$EMAIL" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo "❌ Error: No se pudo encontrar el usuario $EMAIL"
    exit 1
fi

echo "✅ Usuario encontrado: $USER_ID"
echo "🔄 Actualizando contraseña..."

# Actualizar contraseña
RESPONSE=$(curl -s -X PUT \
  "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$PASSWORD\"}")

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error actualizando contraseña:"
    echo "$RESPONSE" | grep -o '"message":"[^"]*"'
    exit 1
fi

echo "✅ Contraseña actualizada exitosamente"
echo ""
echo "📋 Credenciales:"
echo "   Email: $EMAIL"
echo "   Contraseña: $PASSWORD"
echo ""
echo "💡 Ahora puedes iniciar sesión con estas credenciales"

