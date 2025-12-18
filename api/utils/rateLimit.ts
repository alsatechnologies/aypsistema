/**
 * Rate Limiting simple para APIs serverless
 * Usa un Map en memoria (se resetea en cada cold start)
 * Para producción, considera usar Redis o un servicio externo
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// Store en memoria (se resetea en cada cold start de Vercel)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Verifica si una solicitud excede el límite de tasa
 * @param identifier Identificador único (IP, usuario, etc.)
 * @param limit Número máximo de solicitudes
 * @param windowMs Ventana de tiempo en milisegundos
 * @returns true si está dentro del límite, false si excedió
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000 // 1 minuto por defecto
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Obtener o crear entrada
  let entry = rateLimitStore.get(key);

  // Si no existe o la ventana expiró, crear nueva entrada
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Incrementar contador
  entry.count++;

  // Verificar límite
  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  // Limpiar entradas expiradas periódicamente (cada 100 requests)
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
  }

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Obtiene el IP del request (considerando proxies)
 */
export function getClientIP(req: any): string {
  // Vercel proporciona el IP en headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback (no debería llegar aquí en Vercel)
  return req.socket?.remoteAddress || 'unknown';
}

