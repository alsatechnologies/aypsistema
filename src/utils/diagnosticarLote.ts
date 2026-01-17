/**
 * Utilidad para diagnosticar por qué no se generó un lote para un embarque
 */

export interface DiagnosticoLote {
  boleta: string;
  tieneLote: boolean;
  codigoLote: string | null;
  estatus: string | null;
  condiciones: {
    estatusCompletado: boolean;
    sinLote: boolean;
    tieneCliente: boolean;
    tieneProducto: boolean;
    tieneAlmacen: boolean;
    tieneTipoEmbarque: boolean;
  };
  puedeGenerarLote: boolean;
  razonNoGenera: string[];
}

/**
 * Analiza un embarque y determina por qué no tiene lote o si puede generarlo
 */
export function diagnosticarLote(embarque: {
  boleta: string;
  codigo_lote?: string | null;
  estatus?: string | null;
  cliente_id?: number | null;
  producto_id?: number | null;
  almacen_id?: number | null;
  tipo_embarque?: string | null;
}): DiagnosticoLote {
  const tieneLote = !!(embarque.codigo_lote && embarque.codigo_lote.trim() !== '');
  const estatus = embarque.estatus || null;
  const tieneCliente = !!(embarque.cliente_id);
  const tieneProducto = !!(embarque.producto_id);
  const tieneAlmacen = !!(embarque.almacen_id);
  const tieneTipoEmbarque = !!(embarque.tipo_embarque);
  const estatusCompletado = estatus === 'Completado';
  const sinLote = !tieneLote;

  const condiciones = {
    estatusCompletado,
    sinLote,
    tieneCliente,
    tieneProducto,
    tieneAlmacen,
    tieneTipoEmbarque,
  };

  const razonNoGenera: string[] = [];

  if (tieneLote) {
    razonNoGenera.push('Ya tiene lote asignado');
  } else {
    if (!estatusCompletado) {
      razonNoGenera.push(`Estatus es "${estatus}" (debe ser "Completado")`);
    }
    if (!tieneCliente) {
      razonNoGenera.push('No tiene cliente asignado');
    }
    if (!tieneProducto) {
      razonNoGenera.push('No tiene producto asignado');
    }
    if (!tieneAlmacen) {
      razonNoGenera.push('No tiene almacén asignado');
    }
    if (!tieneTipoEmbarque) {
      razonNoGenera.push('No tiene tipo de embarque (Nacional/Exportación)');
    }
  }

  const puedeGenerarLote = estatusCompletado && sinLote && tieneCliente && tieneProducto && tieneAlmacen && tieneTipoEmbarque;

  return {
    boleta: embarque.boleta,
    tieneLote,
    codigoLote: embarque.codigo_lote || null,
    estatus,
    condiciones,
    puedeGenerarLote,
    razonNoGenera,
  };
}

