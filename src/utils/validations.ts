/**
 * Utilidades de validación para formularios críticos
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validar datos de recepción antes de guardar
 */
export function validarRecepcion(data: {
  producto_id?: number | null;
  proveedor_id?: number | null;
  peso_bruto?: number | null;
  peso_tara?: number | null;
  peso_neto?: number | null;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.producto_id) {
    errors.push('El producto es requerido');
  }

  if (!data.proveedor_id) {
    errors.push('El proveedor es requerido');
  }

  if (data.peso_bruto !== null && data.peso_bruto !== undefined) {
    if (data.peso_bruto < 0) {
      errors.push('El peso bruto no puede ser negativo');
    }
    if (data.peso_bruto === 0) {
      errors.push('El peso bruto debe ser mayor a cero');
    }
  }

  if (data.peso_tara !== null && data.peso_tara !== undefined) {
    if (data.peso_tara < 0) {
      errors.push('El peso tara no puede ser negativo');
    }
    if (data.peso_tara === 0) {
      errors.push('El peso tara debe ser mayor a cero');
    }
  }

  if (data.peso_bruto !== null && data.peso_bruto !== undefined &&
      data.peso_tara !== null && data.peso_tara !== undefined) {
    if (data.peso_tara > data.peso_bruto) {
      errors.push('El peso tara no puede ser mayor que el peso bruto');
    }
  }

  if (data.peso_neto !== null && data.peso_neto !== undefined) {
    if (data.peso_neto < 0) {
      errors.push('El peso neto no puede ser negativo');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validar datos de embarque antes de guardar
 */
export function validarEmbarque(data: {
  producto_id?: number | null;
  cliente_id?: number | null;
  peso_bruto?: number | null;
  peso_tara?: number | null;
  peso_neto?: number | null;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.producto_id) {
    errors.push('El producto es requerido');
  }

  if (!data.cliente_id) {
    errors.push('El cliente es requerido');
  }

  if (data.peso_bruto !== null && data.peso_bruto !== undefined) {
    if (data.peso_bruto < 0) {
      errors.push('El peso bruto no puede ser negativo');
    }
    if (data.peso_bruto === 0) {
      errors.push('El peso bruto debe ser mayor a cero');
    }
  }

  if (data.peso_tara !== null && data.peso_tara !== undefined) {
    if (data.peso_tara < 0) {
      errors.push('El peso tara no puede ser negativo');
    }
    if (data.peso_tara === 0) {
      errors.push('El peso tara debe ser mayor a cero');
    }
  }

  if (data.peso_bruto !== null && data.peso_bruto !== undefined &&
      data.peso_tara !== null && data.peso_tara !== undefined) {
    if (data.peso_tara > data.peso_bruto) {
      errors.push('El peso tara no puede ser mayor que el peso bruto');
    }
  }

  if (data.peso_neto !== null && data.peso_neto !== undefined) {
    if (data.peso_neto < 0) {
      errors.push('El peso neto no puede ser negativo');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validar datos de cliente antes de guardar
 */
export function validarCliente(data: {
  empresa?: string;
  rfc?: string;
  tipo_cliente?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.empresa || data.empresa.trim() === '') {
    errors.push('El nombre de la empresa es requerido');
  }

  // RFC es opcional, pero si se proporciona, debe tener formato válido
  if (data.rfc && data.rfc.trim() !== '') {
    // Validar formato básico de RFC (12-13 caracteres alfanuméricos)
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
    if (!rfcRegex.test(data.rfc.trim())) {
      errors.push('El formato del RFC no es válido');
    }
  }

  if (!data.tipo_cliente || data.tipo_cliente.trim() === '') {
    errors.push('El tipo de cliente es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validar datos de proveedor antes de guardar
 */
export function validarProveedor(data: {
  empresa?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.empresa || data.empresa.trim() === '') {
    errors.push('El nombre de la empresa es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validar datos de producto antes de guardar
 */
export function validarProducto(data: {
  nombre?: string;
  codigo_boleta?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.nombre || data.nombre.trim() === '') {
    errors.push('El nombre del producto es requerido');
  }

  if (!data.codigo_boleta || data.codigo_boleta.trim() === '') {
    errors.push('El código de boleta es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validar que un registro no esté completado antes de permitir modificaciones
 * Permite modificación si el usuario es Administrador u Oficina
 */
export function puedeModificarRegistro(estatus: string, rolUsuario?: string): ValidationResult {
  const errors: string[] = [];

  // Administrador y Oficina pueden modificar registros completados
  const puedeModificarCompletados = rolUsuario === 'Administrador' || rolUsuario === 'Oficina';

  if (estatus === 'Completado' && !puedeModificarCompletados) {
    errors.push('No se puede modificar un registro completado. Contacte al administrador si necesita hacer cambios.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

