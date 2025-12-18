# 📦 GUÍA DE BACKUPS SEMANALES

## 🎯 Objetivo
Realizar backups semanales de los datos críticos del sistema para garantizar recuperación en caso de pérdida de datos.

## ⏰ Frecuencia
**Cada semana** (recomendado: domingos por la noche)

## 📋 Proceso Manual

### Opción 1: Backup desde Supabase Dashboard (Recomendado)

1. **Acceder a Supabase Dashboard**
   - Ir a: https://supabase.com/dashboard
   - Seleccionar tu proyecto

2. **Ir a Settings → Database**
   - En el menú lateral, click en "Settings"
   - Seleccionar "Database"

3. **Descargar Backup**
   - Buscar sección "Database Backups"
   - Click en "Download" del backup más reciente
   - El archivo será un `.sql` o `.dump`

4. **Guardar Backup**
   - Nombrar archivo: `backup_YYYY-MM-DD.sql`
   - Guardar en:
     - Google Drive / OneDrive (recomendado)
     - USB externo
     - Servidor local (si tienes)
   - Mantener últimos 4 backups (1 mes)

### Opción 2: Backup desde Supabase CLI

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login
supabase login

# Descargar backup
supabase db dump -f backup_$(date +%Y-%m-%d).sql
```

## 📊 Tablas Críticas a Verificar

Después de descargar, verificar que el backup contiene:

- ✅ `clientes`
- ✅ `proveedores`
- ✅ `productos`
- ✅ `almacenes`
- ✅ `recepciones`
- ✅ `embarques`
- ✅ `ordenes`
- ✅ `movimientos`
- ✅ `ingresos`
- ✅ `usuarios`
- ✅ `lotes`
- ✅ `consecutivos_lotes`

## 🔄 Restaurar desde Backup

### Si necesitas restaurar:

1. **Ir a Supabase Dashboard → Database**
2. **Click en "Restore from backup"**
3. **Seleccionar el archivo de backup**
4. **Confirmar restauración**

⚠️ **ADVERTENCIA**: Restaurar sobrescribirá todos los datos actuales.

## 📅 Recordatorio

- [ ] Configurar recordatorio semanal en calendario
- [ ] Asignar responsable de backups
- [ ] Verificar que backups se están guardando correctamente

## 🔐 Seguridad de Backups

- ✅ Los backups contienen datos sensibles
- ✅ Guardar en ubicación segura
- ✅ No compartir backups públicamente
- ✅ Considerar encriptación si se guardan en la nube

## 📝 Checklist Semanal

- [ ] Backup descargado
- [ ] Backup guardado en ubicación segura
- [ ] Backup verificado (tamaño > 0, fecha correcta)
- [ ] Backup anterior eliminado (si tienes más de 4)
- [ ] Fecha de backup registrada

---

**Último backup realizado:** _______________  
**Próximo backup programado:** _______________

