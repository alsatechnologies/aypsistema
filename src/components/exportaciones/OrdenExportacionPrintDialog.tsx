import React, { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { OrdenExportacion } from '@/services/supabase/exportaciones';

const ESTATUS_ORDEN: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const TIPO_UNIDAD: Record<string, string> = {
  jumbo: 'Jumbo',
  tolva: 'Tolva',
  contenedor: 'Contenedor',
  camion: 'Camión',
};

interface Props {
  orden: OrdenExportacion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrdenExportacionPrintDialog: React.FC<Props> = ({ orden, open, onOpenChange }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orden de Exportación ${orden?.folio ?? ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .orden { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 20px; font-weight: bold; }
            .header .fecha { font-size: 12px; color: #444; }
            .folio-box { background: #f5f5f5; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .folio-box .label { font-size: 12px; color: #444; }
            .folio-box .folio { font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
            .info-row { display: flex; margin-bottom: 6px; font-size: 13px; }
            .info-label { font-weight: 600; width: 150px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
            th, td { border: 1px solid #bbb; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
            .notas { font-size: 13px; white-space: pre-wrap; border: 1px solid #ccc; border-radius: 6px; padding: 8px; min-height: 48px; margin-bottom: 20px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 56px; text-align: center; font-size: 13px; }
            .signature-line { border-bottom: 1px solid #333; height: 48px; margin-bottom: 6px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!orden) return null;

  const cargas = orden.cargas ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Vista previa de orden de exportación
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white text-black p-6 rounded-lg border">
          <div className="orden">
            <div className="header flex justify-between items-end border-b-2 border-gray-700 pb-3 mb-5">
              <h1 className="text-xl font-bold">Orden de Exportación</h1>
              <span className="fecha text-xs text-gray-600">
                Impresa: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
              </span>
            </div>

            <div className="folio-box bg-gray-100 p-3 rounded-lg text-center mb-5">
              <p className="label text-xs text-gray-600">Folio</p>
              <p className="folio text-3xl font-bold font-mono tracking-widest">{orden.folio}</p>
            </div>

            <div className="info-grid grid grid-cols-2 gap-4 mb-5">
              <div>
                <h3 className="section-title font-bold text-sm border-b pb-1 mb-2">PEDIDO</h3>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Cliente:</span><span>{orden.cliente?.empresa ?? '—'}</span></div>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Producto:</span><span>{orden.producto}</span></div>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Unidades:</span><span>{orden.unidades_solicitadas} {TIPO_UNIDAD[orden.tipo_unidad] ?? orden.tipo_unidad}</span></div>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Estatus:</span><span>{ESTATUS_ORDEN[orden.estatus] ?? orden.estatus}</span></div>
              </div>
              <div>
                <h3 className="section-title font-bold text-sm border-b pb-1 mb-2">FECHAS Y RESPONSABLE</h3>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Fecha de pedido:</span><span>{orden.fecha_pedido}</span></div>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Fecha de embarque:</span><span>{orden.fecha_embarque ?? '—'}</span></div>
                <div className="info-row flex text-sm mb-1"><span className="info-label font-semibold w-36">Responsable de carga:</span><span>{orden.responsable_carga ?? '—'}</span></div>
              </div>
            </div>

            <h3 className="section-title font-bold text-sm border-b pb-1 mb-2">UNIDADES ASIGNADAS</h3>
            <table className="w-full text-xs mb-5 border-collapse">
              <thead>
                <tr>
                  <th className="border p-1.5 text-left bg-gray-100">Unidad</th>
                  <th className="border p-1.5 text-left bg-gray-100">Tipo</th>
                  <th className="border p-1.5 text-left bg-gray-100">Ubicación</th>
                  <th className="border p-1.5 text-left bg-gray-100">Fecha embarque</th>
                  <th className="border p-1.5 text-left bg-gray-100">Notas</th>
                </tr>
              </thead>
              <tbody>
                {cargas.length === 0 ? (
                  <tr><td className="border p-1.5" colSpan={5}>Sin unidades asignadas</td></tr>
                ) : cargas.map(c => (
                  <tr key={c.id}>
                    <td className="border p-1.5 font-mono">{c.unidad?.identificador ?? '—'}</td>
                    <td className="border p-1.5">{c.unidad ? (TIPO_UNIDAD[c.unidad.tipo] ?? c.unidad.tipo) : '—'}</td>
                    <td className="border p-1.5">{c.ubicacion_actual ?? '—'}</td>
                    <td className="border p-1.5">{c.fecha_embarque ?? '—'}</td>
                    <td className="border p-1.5">{c.notas ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="section-title font-bold text-sm border-b pb-1 mb-2">NOTAS</h3>
            <div className="notas text-sm whitespace-pre-wrap border rounded p-2 min-h-12 mb-5">{orden.notas ?? ''}</div>

            <div className="signatures grid grid-cols-2 gap-12 mt-14 text-center text-sm">
              <div>
                <div className="signature-line border-b border-gray-700 h-12 mb-1" />
                <p>{orden.responsable_carga ?? 'Responsable de carga'}</p>
                <p className="text-xs text-gray-600">Responsable de carga</p>
              </div>
              <div>
                <div className="signature-line border-b border-gray-700 h-12 mb-1" />
                <p>&nbsp;</p>
                <p className="text-xs text-gray-600">Autorizó</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrdenExportacionPrintDialog;
