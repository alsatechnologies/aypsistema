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
    // Detectar formato ISO con fecha y hora (YYYY-MM-DDTHH:mm:ss)
    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/;
    const match = isoString.match(isoPattern);
    
    if (match) {
      // Es una fecha ISO - Supabase SIEMPRE devuelve UTC, incluso sin 'Z'
      const [, year, month, day, hours, minutes, seconds, timezone] = match;
      const yearNum = Number(year);
      const monthNum = Number(month);
      const dayNum = Number(day);
      const utcHours = Number(hours);
      const minutesNum = Number(minutes);
      
      // Convertir de UTC a MST (restar 7 horas) - SIEMPRE porque viene de Supabase
      let mstHours = utcHours - 7;
      let mstDay = dayNum;
      let mstMonth = monthNum;
      let mstYear = yearNum;
      
      // Manejar desbordamiento de horas (si mstHours < 0, retroceder un día)
      if (mstHours < 0) {
        mstHours += 24;
        mstDay--;
        if (mstDay < 1) {
          mstMonth--;
          if (mstMonth < 1) {
            mstMonth = 12;
            mstYear--;
          }
          // Obtener días del mes anterior
          const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
          mstDay = daysInPrevMonth;
        }
      }
      
      const d = String(mstDay).padStart(2, '0');
      const m = String(mstMonth).padStart(2, '0');
      const y = mstYear;
      const h = String(mstHours).padStart(2, '0');
      const min = String(minutesNum).padStart(2, '0');
      
      return `${d}/${m}/${y} ${h}:${min}`;
    }
    
    // Si tiene 'Z' explícito, también tratarlo como UTC
    if (isoString.includes('Z')) {
      const cleanString = isoString.replace('Z', '');
      const parts = cleanString.split('T');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const [year, month, day] = datePart.split('-').map(Number);
        const [time] = timePart.split('.');
        const [utcHours, minutes] = time.split(':').map(Number);
        
        let mstHours = utcHours - 7;
        let mstDay = day;
        let mstMonth = month;
        let mstYear = year;
        
        if (mstHours < 0) {
          mstHours += 24;
          mstDay--;
          if (mstDay < 1) {
            mstMonth--;
            if (mstMonth < 1) {
              mstMonth = 12;
              mstYear--;
            }
            const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
            mstDay = daysInPrevMonth;
          }
        }
        
        const d = String(mstDay).padStart(2, '0');
        const m = String(mstMonth).padStart(2, '0');
        const y = mstYear;
        const h = String(mstHours).padStart(2, '0');
        const min = String(minutes).padStart(2, '0');
        
        return `${d}/${m}/${y} ${h}:${min}`;
      }
    }
    
    // Si viene con timezone explícito (+HH:mm o -HH:mm)
    if (isoString.match(/[+-]\d{2}:\d{2}$/)) {
      // Parsear manualmente para convertir a UTC primero, luego a MST
      const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([+-]\d{2}):(\d{2})$/);
      if (match) {
        const [, year, month, day, hours, minutes, seconds, tzSign, tzHours, tzMinutes] = match;
        const yearNum = Number(year);
        const monthNum = Number(month);
        const dayNum = Number(day);
        const hoursNum = Number(hours);
        const minutesNum = Number(minutes);
        
        // Convertir timezone a offset en horas
        const tzOffsetHours = (tzSign === '+' ? 1 : -1) * (Number(tzHours) + Number(tzMinutes) / 60);
        
        // Convertir a UTC (sumar el offset del timezone)
        const utcHours = hoursNum - tzOffsetHours;
        
        // Convertir de UTC a MST (restar 7 horas)
        let mstHours = utcHours - 7;
        let mstDay = dayNum;
        let mstMonth = monthNum;
        let mstYear = yearNum;
        
        // Manejar desbordamiento de horas
        if (mstHours < 0) {
          mstHours += 24;
          mstDay--;
          if (mstDay < 1) {
            mstMonth--;
            if (mstMonth < 1) {
              mstMonth = 12;
              mstYear--;
            }
            const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
            mstDay = daysInPrevMonth;
          }
        } else if (mstHours >= 24) {
          mstHours -= 24;
          mstDay++;
          const daysInMonth = new Date(mstYear, mstMonth, 0).getDate();
          if (mstDay > daysInMonth) {
            mstDay = 1;
            mstMonth++;
            if (mstMonth > 12) {
              mstMonth = 1;
              mstYear++;
            }
          }
        }
        
        const d = String(mstDay).padStart(2, '0');
        const m = String(mstMonth).padStart(2, '0');
        const y = mstYear;
        const h = String(Math.floor(mstHours)).padStart(2, '0');
        const min = String(minutesNum).padStart(2, '0');
        return `${d}/${m}/${y} ${h}:${min}`;
      }
      
      // Fallback: usar Date si el regex no funciona
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return isoString;
      }
      // Obtener componentes UTC y convertir a MST
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      let mstHours = utcHours - 7;
      let mstDay = date.getUTCDate();
      let mstMonth = date.getUTCMonth() + 1;
      let mstYear = date.getUTCFullYear();
      
      if (mstHours < 0) {
        mstHours += 24;
        mstDay--;
        if (mstDay < 1) {
          mstMonth--;
          if (mstMonth < 1) {
            mstMonth = 12;
            mstYear--;
          }
          const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
          mstDay = daysInPrevMonth;
        }
      }
      
      const d = String(mstDay).padStart(2, '0');
      const m = String(mstMonth).padStart(2, '0');
      const y = mstYear;
      const h = String(mstHours).padStart(2, '0');
      const min = String(utcMinutes).padStart(2, '0');
      return `${d}/${m}/${y} ${h}:${min}`;
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
    // Si viene con timezone UTC (Z), convertir explícitamente de UTC a MST (UTC-7)
    if (isoString.includes('Z')) {
      const cleanString = isoString.replace('Z', '');
      const parts = cleanString.split('T');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const [year, month, day] = datePart.split('-').map(Number);
        const [time] = timePart.split('.');
        const [utcHours, minutes, seconds = 0] = time.split(':').map(Number);
        
        // Convertir de UTC a MST (restar 7 horas)
        let mstHours = utcHours - 7;
        let mstDay = day;
        let mstMonth = month;
        let mstYear = year;
        
        // Manejar desbordamiento de horas
        if (mstHours < 0) {
          mstHours += 24;
          mstDay--;
          if (mstDay < 1) {
            mstMonth--;
            if (mstMonth < 1) {
              mstMonth = 12;
              mstYear--;
            }
            const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
            mstDay = daysInPrevMonth;
          }
        }
        
        const d = String(mstDay).padStart(2, '0');
        const m = String(mstMonth).padStart(2, '0');
        const y = mstYear;
        const h = String(mstHours).padStart(2, '0');
        const min = String(minutes).padStart(2, '0');
        const sec = String(seconds).padStart(2, '0');
        
        return `${d}/${m}/${y} ${h}:${min}:${sec}`;
      }
    }
    
    // Si viene con timezone explícito (+HH:mm o -HH:mm)
    if (isoString.match(/[+-]\d{2}:\d{2}$/)) {
      // Parsear manualmente para convertir a UTC primero, luego a MST
      const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([+-]\d{2}):(\d{2})$/);
      if (match) {
        const [, year, month, day, hours, minutes, seconds, tzSign, tzHours, tzMinutes] = match;
        const yearNum = Number(year);
        const monthNum = Number(month);
        const dayNum = Number(day);
        const hoursNum = Number(hours);
        const minutesNum = Number(minutes);
        const secondsNum = Number(seconds);
        
        // Convertir timezone a offset en horas
        const tzOffsetHours = (tzSign === '+' ? 1 : -1) * (Number(tzHours) + Number(tzMinutes) / 60);
        
        // Convertir a UTC (sumar el offset del timezone)
        const utcHours = hoursNum - tzOffsetHours;
        
        // Convertir de UTC a MST (restar 7 horas)
        let mstHours = utcHours - 7;
        let mstDay = dayNum;
        let mstMonth = monthNum;
        let mstYear = yearNum;
        
        // Manejar desbordamiento de horas
        if (mstHours < 0) {
          mstHours += 24;
          mstDay--;
          if (mstDay < 1) {
            mstMonth--;
            if (mstMonth < 1) {
              mstMonth = 12;
              mstYear--;
            }
            const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
            mstDay = daysInPrevMonth;
          }
        } else if (mstHours >= 24) {
          mstHours -= 24;
          mstDay++;
          const daysInMonth = new Date(mstYear, mstMonth, 0).getDate();
          if (mstDay > daysInMonth) {
            mstDay = 1;
            mstMonth++;
            if (mstMonth > 12) {
              mstMonth = 1;
              mstYear++;
            }
          }
        }
        
        const d = String(mstDay).padStart(2, '0');
        const m = String(mstMonth).padStart(2, '0');
        const y = mstYear;
        const h = String(Math.floor(mstHours)).padStart(2, '0');
        const min = String(minutesNum).padStart(2, '0');
        const sec = String(secondsNum).padStart(2, '0');
        return `${d}/${m}/${y} ${h}:${min}:${sec}`;
      }
      
      // Fallback: usar Date si el regex no funciona
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return isoString;
      }
      // Obtener componentes UTC y convertir a MST
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      const utcSeconds = date.getUTCSeconds();
      let mstHours = utcHours - 7;
      let mstDay = date.getUTCDate();
      let mstMonth = date.getUTCMonth() + 1;
      let mstYear = date.getUTCFullYear();
      
      if (mstHours < 0) {
        mstHours += 24;
        mstDay--;
        if (mstDay < 1) {
          mstMonth--;
          if (mstMonth < 1) {
            mstMonth = 12;
            mstYear--;
          }
          const daysInPrevMonth = new Date(mstYear, mstMonth, 0).getDate();
          mstDay = daysInPrevMonth;
        }
      }
      
      const d = String(mstDay).padStart(2, '0');
      const m = String(mstMonth).padStart(2, '0');
      const y = mstYear;
      const h = String(mstHours).padStart(2, '0');
      const min = String(utcMinutes).padStart(2, '0');
      const sec = String(utcSeconds).padStart(2, '0');
      return `${d}/${m}/${y} ${h}:${min}:${sec}`;
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

