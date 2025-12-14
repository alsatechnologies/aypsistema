import React, { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { formatDateTimeMST } from '@/utils/dateUtils';

interface Orden {
  id: number;
  boleta: string;
  producto: string;
  cliente: string;
  tipoOperacion: 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación';
  destino: string;
  nombreChofer: string;
  vehiculo: string;
  placas: string;
  fechaHoraIngreso: string;
  estatus: 'Nuevo' | 'En Proceso' | 'Completado';
}

interface BoletaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden: Orden | null;
}

const BoletaPreviewDialog: React.FC<BoletaPreviewDialogProps> = ({ open, onOpenChange, orden }) => {
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
          <title>Boleta ${orden?.boleta}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .boleta { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .header-info { display: flex; justify-content: space-between; font-size: 14px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: 600; width: 120px; }
            .info-value { flex: 1; }
            .boleta-box { background: #f5f5f5; padding: 12px; border-radius: 8px; text-align: center; margin: 16px 0; }
            .boleta-box .boleta { font-size: 28px; font-weight: bold; font-family: monospace; }
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

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'Reciba': 'RECEPCIÓN',
      'Embarque Nacional': 'EMBARQUE NACIONAL',
      'Embarque Exportación': 'EMBARQUE EXPORTACIÓN',
    };
    return labels[tipo] || tipo.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Vista Previa de Boleta
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-6 rounded-lg border">
          <div className="boleta">
            {/* Header */}
            <div className="header text-center border-b-2 border-foreground/20 pb-4 mb-6">
              <div className="header-info flex justify-start text-sm text-muted-foreground">
                <span>Fecha: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</span>
              </div>
            </div>

            {/* Boleta Box */}
            <div className="boleta-box bg-muted/50 p-4 rounded-lg text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Número de Boleta</p>
              <p className="boleta text-3xl font-bold font-mono tracking-wider">{orden.boleta}</p>
            </div>

            {/* Info Grid */}
            <div className="info-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Producto */}
              <div className="section">
                <h3 className="section-title font-bold text-base border-b pb-2 mb-3">INFORMACIÓN DEL PRODUCTO</h3>
                <div className="space-y-2">
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Producto:</span>
                    <span className="info-value">{orden.producto}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Cliente:</span>
                    <span className="info-value">{orden.cliente}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Destino:</span>
                    <span className="info-value">{orden.destino}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Operación:</span>
                    <span className="info-value">{orden.tipoOperacion}</span>
                  </div>
                </div>
              </div>

              {/* Información del Transporte */}
              <div className="section">
                <h3 className="section-title font-bold text-base border-b pb-2 mb-3">INFORMACIÓN DEL TRANSPORTE</h3>
                <div className="space-y-2">
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Conductor:</span>
                    <span className="info-value">{orden.nombreChofer}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Vehículo:</span>
                    <span className="info-value">{orden.vehiculo}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Placas:</span>
                    <span className="info-value font-mono">{orden.placas}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28">Ingreso:</span>
                    <span className="info-value">{formatDateTimeMST(orden.fechaHoraIngreso)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoletaPreviewDialog;
