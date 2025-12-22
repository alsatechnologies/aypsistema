import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { formatDateTimeMST } from '@/utils/dateUtils';
import { printTicket, listPrinters } from '@/services/api/printer';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
// Logo se carga desde el servidor (logo_escpos.bin)

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
  const { usuario } = useAuth();

  const handlePrint = async () => {
    if (!orden) return;

    setIsPrinting(true);
    try {
      // Primero, intentar detectar el nombre de la impresora disponible
      let printerName = 'POS-80c'; // Nombre por defecto
      
      console.log('🔍 [PRINT] Buscando impresoras disponibles para rol:', usuario?.rol);
      const printersResult = await listPrinters(usuario?.rol);
      
      if (printersResult.success && printersResult.printers && printersResult.printers.length > 0) {
        // Buscar una impresora que contenga "POS" o "80" en el nombre, o usar la primera disponible
        const posPrinter = printersResult.printers.find(p => 
          p.toLowerCase().includes('pos') || 
          p.toLowerCase().includes('80') ||
          p.toLowerCase().includes('ticket')
        );
        printerName = posPrinter || printersResult.printers[0];
        console.log('✅ [PRINT] Impresora detectada:', printerName);
        console.log('📋 [PRINT] Todas las impresoras disponibles:', printersResult.printers);
      } else {
        console.warn('⚠️ [PRINT] No se pudieron listar impresoras, usando nombre por defecto:', printerName);
        if (printersResult.error) {
          console.error('❌ [PRINT] Error al listar impresoras:', printersResult.error);
        }
      }

      // Formatear fecha actual
      const fechaActual = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

      // Preparar datos para la API (el logo se carga desde el servidor)
      const printData = {
        rol_usuario: usuario?.rol, // Enviar rol del usuario para determinar qué API usar
        printer_config: {
          connection_type: 'usb' as const,
          printer_name: printerName,
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
        // Logo se carga desde logo_escpos.bin en el servidor
      };

      console.log('🖨️ [PRINT] Enviando ticket a impresora:', printerName);
      const result = await printTicket(printData);

      if (result.success) {
        toast.success('Ticket enviado a impresión correctamente');
      } else {
        console.error('❌ [PRINT] Error al imprimir:', result.error);
        toast.error(result.error || 'Error al imprimir ticket');
      }
    } catch (error) {
      console.error('❌ [PRINT] Error al imprimir:', error);
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

        <div ref={printRef} className="bg-card p-6 rounded-lg border border-border">
          <div className="boleta">
            {/* Header */}
            <div className="header text-center border-b-2 border-border pb-4 mb-6">
              <div className="header-info flex justify-start text-sm text-muted-foreground">
                <span>Fecha: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</span>
              </div>
            </div>

            {/* Boleta Box */}
            <div className="boleta-box bg-muted/50 p-4 rounded-lg text-center mb-6 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Número de Boleta</p>
              <p className="boleta text-3xl font-bold font-mono tracking-wider text-foreground">{orden.boleta}</p>
            </div>

            {/* Info Grid */}
            <div className="info-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Producto */}
              <div className="section">
                <h3 className="section-title font-bold text-base border-b border-border pb-2 mb-3 text-foreground">INFORMACIÓN DEL PRODUCTO</h3>
                <div className="space-y-2">
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Producto:</span>
                    <span className="info-value text-foreground">{orden.producto}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Cliente:</span>
                    <span className="info-value text-foreground">{orden.cliente}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Destino:</span>
                    <span className="info-value text-foreground">{orden.destino}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Operación:</span>
                    <span className="info-value text-foreground">{orden.tipoOperacion}</span>
                  </div>
                </div>
              </div>

              {/* Información del Transporte */}
              <div className="section">
                <h3 className="section-title font-bold text-base border-b border-border pb-2 mb-3 text-foreground">INFORMACIÓN DEL TRANSPORTE</h3>
                <div className="space-y-2">
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Conductor:</span>
                    <span className="info-value text-foreground">{orden.nombreChofer}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Vehículo:</span>
                    <span className="info-value text-foreground">{orden.vehiculo}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Placas:</span>
                    <span className="info-value font-mono text-foreground">{orden.placas}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-28 text-foreground">Ingreso:</span>
                    <span className="info-value text-foreground">{formatDateTimeMST(orden.fechaHoraIngreso)}</span>
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
