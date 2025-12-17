/**
 * Utilidades para manejo de fechas en zona horaria MST (Mountain Standard Time)
 * MST es UTC-7
 */

/**
 * Obtiene la fecha/hora actual en formato ISO para zona horaria MST
 * @returns String en formato ISO con zona horaria MST
 */
export function getCurrentDateTimeMST(): string {
  const now = new Date();
  
  // Obtener la hora local del sistema (que debería estar en MST)
  // Formatear como ISO string pero usando la hora local
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Formatea una fecha ISO a formato legible en zona horaria MST
 * @param isoString - String en formato ISO (sin timezone, asume MST)
 * @returns String formateado como "DD/MM/YYYY HH:mm"
 */
export function formatDateTimeMST(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    // Si el string ya está en formato local (sin timezone), parsearlo directamente
    // Formato esperado: YYYY-MM-DDTHH:mm:ss.mmm o YYYY-MM-DD
    const parts = isoString.split('T');
    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split('-');
    
    // Si tiene parte de hora
    if (parts.length === 2 && timePart) {
      const [time] = timePart.split('.');
      const [hours, minutes] = time.split(':');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    // Si solo es fecha (YYYY-MM-DD), mostrar sin hora
    if (year && month && day && !timePart) {
      return `${day}/${month}/${year}`;
    }
    
    // Si viene con timezone o formato desconocido, usar Date para parsearlo
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString; // Si no se puede parsear, devolver original
    }
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    return `${d}/${m}/${y} ${h}:${min}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString;
  }
}

/**
 * Formatea una fecha ISO a formato completo con segundos en zona horaria MST
 * @param isoString - String en formato ISO (sin timezone, asume MST)
 * @returns String formateado como "DD/MM/YYYY HH:mm:ss"
 */
export function formatDateTimeFullMST(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    // Si el string ya está en formato local (sin timezone), parsearlo directamente
    const parts = isoString.split('T');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const [year, month, day] = datePart.split('-');
      const [time] = timePart.split('.');
      const [hours, minutes, seconds] = time.split(':');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    
    // Si viene con timezone, usar Date para parsearlo
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString;
  }
}

