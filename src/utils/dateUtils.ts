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
 * @param isoString - String en formato ISO (puede venir con UTC de Supabase)
 * @returns String formateado como "DD/MM/YYYY HH:mm" en MST
 */
export function formatDateTimeMST(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    // Si viene con timezone (Z o +HH:mm), convertir de UTC a MST (UTC-7)
    if (isoString.includes('Z') || isoString.match(/[+-]\d{2}:\d{2}$/)) {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return isoString;
      }
      // Convertir de UTC a MST (restar 7 horas)
      const mstDate = new Date(date.getTime() - (7 * 60 * 60 * 1000));
      const day = String(mstDate.getUTCDate()).padStart(2, '0');
      const month = String(mstDate.getUTCMonth() + 1).padStart(2, '0');
      const year = mstDate.getUTCFullYear();
      const hours = String(mstDate.getUTCHours()).padStart(2, '0');
      const minutes = String(mstDate.getUTCMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
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
    
    // Si no se puede parsear, devolver original
    return isoString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString;
  }
}

/**
 * Formatea una fecha ISO a formato completo con segundos en zona horaria MST
 * @param isoString - String en formato ISO (puede venir con UTC de Supabase)
 * @returns String formateado como "DD/MM/YYYY HH:mm:ss" en MST
 */
export function formatDateTimeFullMST(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  
  try {
    // Si viene con timezone (Z o +HH:mm), convertir de UTC a MST (UTC-7)
    if (isoString.includes('Z') || isoString.match(/[+-]\d{2}:\d{2}$/)) {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return isoString;
      }
      // Convertir de UTC a MST (restar 7 horas)
      const mstDate = new Date(date.getTime() - (7 * 60 * 60 * 1000));
      const day = String(mstDate.getUTCDate()).padStart(2, '0');
      const month = String(mstDate.getUTCMonth() + 1).padStart(2, '0');
      const year = mstDate.getUTCFullYear();
      const hours = String(mstDate.getUTCHours()).padStart(2, '0');
      const minutes = String(mstDate.getUTCMinutes()).padStart(2, '0');
      const seconds = String(mstDate.getUTCSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    
    // Si el string ya está en formato local (sin timezone), parsearlo directamente
    const parts = isoString.split('T');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const [year, month, day] = datePart.split('-');
      const [time] = timePart.split('.');
      const [hours, minutes, seconds] = time.split(':');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    
    // Si no se puede parsear, devolver original
    return isoString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString;
  }
}

