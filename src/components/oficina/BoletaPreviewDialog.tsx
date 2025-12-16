import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { formatDateTimeMST } from '@/utils/dateUtils';
import { printTicket } from '@/services/api/printer';
import { toast } from 'sonner';
import { getCompanyLogo } from '@/utils/logoUtils';

interface Orden {
  id: number;
  boleta: string;
  producto: string;
  cliente?: string | null;
  tipoOperacion: 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación';
  destino?: string | null;
  nombreChofer?: string | null;
  vehiculo?: string | null;
  placas?: string | null;
  fechaHoraIngreso?: string | null;
  estatus: 'Nuevo' | 'En Proceso' | 'Completado';
}

interface BoletaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden: Orden | null;
}

const BoletaPreviewDialog: React.FC<BoletaPreviewDialogProps> = ({ open, onOpenChange, orden }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!orden) return;

    setIsPrinting(true);
    try {
      // Formatear fecha actual
      const fechaActual = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

      // Cargar logo en base64
      const logoBase64 = await getCompanyLogo();

      // Preparar datos para la API
      const printData = {
        printer_config: {
          connection_type: 'usb' as const,
          printer_name: 'POS-80c',
        },
        producto: orden.producto || '',
        fecha: fechaActual,
        boleta: orden.boleta || '',
        cliente: orden.cliente || '',
        destino: orden.destino || '',
        placas: orden.placas || '',
        vehiculo: orden.vehiculo || '',
        chofer: orden.nombreChofer || '',
        copias: 2,
        ...(logoBase64 && { logo: logoBase64 }), // Incluir logo solo si se pudo cargar
      };

      const result = await printTicket(printData);

      if (result.success) {
        toast.success('Ticket enviado a impresión correctamente');
      } else {
        toast.error(result.error || 'Error al imprimir ticket');
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error('Error al comunicarse con la impresora');
    } finally {
      setIsPrinting(false);
    }
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
          <Button 
            onClick={handlePrint} 
            className="bg-primary hover:bg-primary/90"
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoletaPreviewDialog;
