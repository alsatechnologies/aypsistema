import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowDown, ArrowUp, Truck, Train, MapPin, Calendar, Scale, Printer, X } from 'lucide-react';

interface Movimiento {
  id: number;
  boleta: string;
  producto: string;
  clienteProveedor: string;
  tipo: 'Entrada' | 'Salida';
  transporte: 'Camión' | 'Ferroviaria';
  fecha: string;
  ubicacion: string;
  pesoNeto: number;
  pesoBruto?: number;
  pesoTara?: number;
  chofer?: string;
  placas?: string;
}

interface DetalleMovimientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimiento: Movimiento | null;
}

const DetalleMovimientoDialog: React.FC<DetalleMovimientoDialogProps> = ({ open, onOpenChange, movimiento }) => {
  if (!movimiento) return null;

  const formatNumber = (num: number) => num.toLocaleString('es-MX');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {movimiento.tipo === 'Entrada' ? (
              <ArrowDown className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowUp className="h-5 w-5 text-blue-600" />
            )}
            Detalle del Movimiento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Boleta</p>
              <p className="text-2xl font-bold font-mono">{movimiento.boleta}</p>
            </div>
            <Badge className={movimiento.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
              {movimiento.tipo === 'Entrada' ? <ArrowDown className="h-3 w-3 mr-1" /> : <ArrowUp className="h-3 w-3 mr-1" />}
              {movimiento.tipo}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Producto</p>
              <p className="font-medium">{movimiento.producto}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{movimiento.tipo === 'Entrada' ? 'Proveedor' : 'Cliente'}</p>
              <p className="font-medium">{movimiento.clienteProveedor}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fecha
              </p>
              <p className="font-medium">{movimiento.fecha}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Ubicación
              </p>
              <p className="font-medium">{movimiento.ubicacion}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Transporte</p>
              <p className="font-medium flex items-center gap-1">
                {movimiento.transporte === 'Camión' ? <Truck className="h-4 w-4" /> : <Train className="h-4 w-4" />}
                {movimiento.transporte}
              </p>
            </div>
            {movimiento.chofer && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Chofer</p>
                <p className="font-medium">{movimiento.chofer}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Pesos */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Registro de Pesos
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <p className="text-xs text-orange-700">Peso Tara</p>
                <p className="text-xl font-bold">{movimiento.pesoTara ? formatNumber(movimiento.pesoTara) : '-'} Kg</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-xs text-blue-700">Peso Bruto</p>
                <p className="text-xl font-bold">{movimiento.pesoBruto ? formatNumber(movimiento.pesoBruto) : '-'} Kg</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${movimiento.tipo === 'Entrada' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-xs ${movimiento.tipo === 'Entrada' ? 'text-green-700' : 'text-blue-700'}`}>Peso Neto</p>
                <p className={`text-xl font-bold ${movimiento.tipo === 'Entrada' ? 'text-green-700' : 'text-blue-700'}`}>
                  {movimiento.tipo === 'Entrada' ? '+' : '-'}{formatNumber(movimiento.pesoNeto)} Kg
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Reimprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleMovimientoDialog;
