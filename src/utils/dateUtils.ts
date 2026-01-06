/**
 * Utilidades para manejo de fechas en zona horaria MST (Mountain Standard Time)
 * MST es UTC-7
 */

/**
 * Obtiene la fecha/hora actual en formato ISO para zona horaria MST
 * Como Supabase interpreta fechas sin timezone como UTC, debemos guardar
 * la hora local + 7 horas para que cuando Supabase la interprete como UTC,
 * al convertirla de vuelta a MST (restando 7), quede la hora local correcta.
 * @returns String en formato ISO sin timezone (será interpretado como UTC por Supabase)
 */
export function getCurrentDateTimeMST(): string {
  const now = new Date();
  
  // Obtener la hora local del sistema (que debería estar en MST)
  const localHours = now.getHours();
  const localMinutes = now.getMinutes();
  const localSeconds = now.getSeconds();
  const localMilliseconds = now.getMilliseconds();
  
  // Convertir hora local a UTC (sumar 7 horas para MST)
  // Esto es porque Supabase interpreta fechas sin timezone como UTC
  let utcHours = localHours + 7;
  let utcDay = now.getDate();
  let utcMonth = now.getMonth() + 1;
  let utcYear = now.getFullYear();
  
  // Manejar desbordamiento de horas
  if (utcHours >= 24) {
    utcHours -= 24;
    utcDay++;
    const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
    if (utcDay > daysInMonth) {
      utcDay = 1;
      utcMonth++;
      if (utcMonth > 12) {
        utcMonth = 1;
        utcYear++;
      }
    }
  }
  
  const year = String(utcYear);
  const month = String(utcMonth).padStart(2, '0');
  const day = String(utcDay).padStart(2, '0');
  const hours = String(utcHours).padStart(2, '0');
  const minutes = String(localMinutes).padStart(2, '0');
  const seconds = String(localSeconds).padStart(2, '0');
  const milliseconds = String(localMilliseconds).padStart(3, '0');
  
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
    // Supabase siempre devuelve UTC, incluso sin 'Z' explícito
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
    
    // Si el string está en formato ISO pero sin timezone explícito (YYYY-MM-DDTHH:mm:ss)
    // Supabase SIEMPRE devuelve UTC, así que tratarlo como UTC
    const isoPatternNoTz = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;
    const matchNoTz = isoString.match(isoPatternNoTz);
    
    if (matchNoTz) {
      // Es formato ISO sin timezone - Supabase siempre devuelve UTC
      const [, year, month, day, hours, minutes] = matchNoTz;
      const yearNum = Number(year);
      const monthNum = Number(month);
      const dayNum = Number(day);
      const utcHours = Number(hours);
      const minutesNum = Number(minutes);
      
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
      }
      
      const d = String(mstDay).padStart(2, '0');
      const m = String(mstMonth).padStart(2, '0');
      const y = mstYear;
      const h = String(mstHours).padStart(2, '0');
      const min = String(minutesNum).padStart(2, '0');
      
      return `${d}/${m}/${y} ${h}:${min}`;
    }
    
    // Si solo es fecha (YYYY-MM-DD), mostrar sin hora
    const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateOnlyMatch = isoString.match(dateOnlyPattern);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
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

