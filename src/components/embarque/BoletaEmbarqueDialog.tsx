import React, { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Ship } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Embarque {
  folio: string;
  producto: string;
  cliente: string;
  destino: string;
  chofer: string;
  fecha: string;
  tipoTransporte: 'Camión' | 'Ferroviaria';
  tipoEmbarque: 'Nacional' | 'Exportación';
  estatus: string;
  pesoBruto?: number;
  pesoTara?: number;
  pesoNeto?: number;
  placas?: string;
  numeroCarro?: string;
  sellos?: {
    selloEntrada1?: string;
    selloEntrada2?: string;
    selloSalida1?: string;
    selloSalida2?: string;
  };
}

interface BoletaEmbarqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embarque: Embarque | null;
}

const BoletaEmbarqueDialog: React.FC<BoletaEmbarqueDialogProps> = ({ open, onOpenChange, embarque }) => {
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
          <title>Boleta Embarque ${embarque?.folio}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .boleta { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #8b5cf6; color: white; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 12px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: 600; width: 140px; }
            .folio-box { background: #f5f5f5; padding: 12px; border-radius: 8px; text-align: center; margin: 16px 0; }
            .folio-box .folio { font-size: 28px; font-weight: bold; font-family: monospace; }
            .pesos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
            .peso-card { padding: 16px; border-radius: 8px; text-align: center; }
            .peso-tara { background: #ffedd5; border: 2px solid #fed7aa; }
            .peso-bruto { background: #dbeafe; border: 2px solid #bfdbfe; }
            .peso-neto { background: #dcfce7; border: 2px solid #bbf7d0; }
            .peso-value { font-size: 24px; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 48px; text-align: center; }
            .signature-line { border-bottom: 1px solid #333; height: 48px; margin-bottom: 8px; }
            .sellos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
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

  if (!embarque) return null;

  const formatNumber = (num?: number) => num ? num.toLocaleString('es-MX') : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Vista Previa de Boleta de Embarque
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-6 rounded-lg border">
          <div className="boleta">
            {/* Header */}
            <div className="header text-center border-b-2 border-foreground/20 pb-4 mb-6">
              <h1 className="text-2xl font-bold mb-2">
                BOLETA DE EMBARQUE {embarque.tipoEmbarque === 'Exportación' ? 'EXPORTACIÓN' : 'NACIONAL'}
              </h1>
              <div className="flex justify-center gap-2">
                <Badge className={embarque.tipoEmbarque === 'Exportación' ? 'bg-purple-500' : 'bg-blue-500'}>
                  {embarque.tipoEmbarque}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Fecha: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>

            {/* Folio Box */}
            <div className="folio-box bg-muted/50 p-4 rounded-lg text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Número de Boleta</p>
              <p className="folio text-3xl font-bold font-mono tracking-wider">{embarque.folio}</p>
            </div>

            {/* Info Grid */}
            <div className="info-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Producto */}
              <div className="section">
                <h3 className="section-title font-bold text-base border-b pb-2 mb-3">INFORMACIÓN DEL PRODUCTO</h3>
                <div className="space-y-2">
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-32">Producto:</span>
                    <span>{embarque.producto}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-32">Cliente:</span>
                    <span>{embarque.cliente}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-32">Destino:</span>
                    <span>{embarque.destino}</span>
                  </div>
                </div>
              </div>

              {/* Información del Transporte */}
              <div className="section">
                <h3 className="section-title font-bold text-base border-b pb-2 mb-3">INFORMACIÓN DEL TRANSPORTE</h3>
                <div className="space-y-2">
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-32">Tipo:</span>
                    <span>{embarque.tipoTransporte}</span>
                  </div>
                  <div className="info-row flex">
                    <span className="info-label font-semibold w-32">Chofer:</span>
                    <span>{embarque.chofer}</span>
                  </div>
                  {embarque.tipoTransporte === 'Camión' && embarque.placas && (
                    <div className="info-row flex">
                      <span className="info-label font-semibold w-32">Placas:</span>
                      <span className="font-mono">{embarque.placas}</span>
                    </div>
                  )}
                  {embarque.tipoTransporte === 'Ferroviaria' && embarque.numeroCarro && (
                    <div className="info-row flex">
                      <span className="info-label font-semibold w-32">No. Carro:</span>
                      <span className="font-mono">{embarque.numeroCarro}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pesos */}
            <div className="section mt-6">
              <h3 className="section-title font-bold text-base border-b pb-2 mb-3">REGISTRO DE PESOS</h3>
              <div className="pesos-grid grid grid-cols-3 gap-4">
                <div className="peso-card p-4 rounded-lg text-center bg-orange-50 border-2 border-orange-200">
                  <p className="text-sm text-orange-700 mb-1">Peso Tara</p>
                  <p className="peso-value text-2xl font-bold">{formatNumber(embarque.pesoTara)} Kg</p>
                </div>
                <div className="peso-card p-4 rounded-lg text-center bg-blue-50 border-2 border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Peso Bruto</p>
                  <p className="peso-value text-2xl font-bold">{formatNumber(embarque.pesoBruto)} Kg</p>
                </div>
                <div className="peso-card p-4 rounded-lg text-center bg-green-50 border-2 border-green-200">
                  <p className="text-sm text-green-700 mb-1">Peso Neto</p>
                  <p className="peso-value text-2xl font-bold text-green-700">{formatNumber(embarque.pesoNeto)} Kg</p>
                </div>
              </div>
            </div>

            {/* Sellos */}
            {embarque.sellos && (
              <div className="section mt-6">
                <h3 className="section-title font-bold text-base border-b pb-2 mb-3">SELLOS</h3>
                <div className="sellos-grid grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-medium mb-1">Sellos de Entrada</p>
                    <p className="font-mono text-sm">{embarque.sellos.selloEntrada1 || '-'} / {embarque.sellos.selloEntrada2 || '-'}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-700 font-medium mb-1">Sellos de Salida</p>
                    <p className="font-mono text-sm">{embarque.sellos.selloSalida1 || '-'} / {embarque.sellos.selloSalida2 || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="signatures grid grid-cols-3 gap-8 mt-12 text-center">
              <div>
                <div className="signature-line border-b border-foreground/40 h-12 mb-2"></div>
                <p className="signature-label text-xs font-semibold">OPERADOR</p>
              </div>
              <div>
                <div className="signature-line border-b border-foreground/40 h-12 mb-2"></div>
                <p className="signature-label text-xs font-semibold">CONDUCTOR</p>
              </div>
              <div>
                <div className="signature-line border-b border-foreground/40 h-12 mb-2"></div>
                <p className="signature-label text-xs font-semibold">SUPERVISOR</p>
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

export default BoletaEmbarqueDialog;
