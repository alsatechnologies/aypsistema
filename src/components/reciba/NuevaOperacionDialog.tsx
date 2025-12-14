import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Train, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Producto } from '@/services/supabase/productos';
import type { Proveedor } from '@/services/supabase/proveedores';

interface NuevaOperacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrear: (operacion: {
    productoId: number;
    proveedorId: number;
    chofer: string;
    placas: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
  }) => void;
  productos: Producto[];
  proveedores: Proveedor[];
}

const NuevaOperacionDialog = ({ open, onOpenChange, onCrear, productos, proveedores }: NuevaOperacionDialogProps) => {
  const [tipoTransporte, setTipoTransporte] = useState<'Camión' | 'Ferroviaria'>('Camión');
  const [productoId, setProductoId] = useState<string>('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [chofer, setChofer] = useState('');
  const [placas, setPlacas] = useState('');

  const handleCrear = () => {
    if (!productoId || !proveedorId || !chofer || !placas) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    onCrear({
      productoId: parseInt(productoId),
      proveedorId: parseInt(proveedorId),
      chofer,
      placas,
      tipoTransporte
    });

    // Reset form
    setProductoId('');
    setProveedorId('');
    setChofer('');
    setPlacas('');
    setTipoTransporte('Camión');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Operación de Recepción
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Transporte */}
          <div className="space-y-2">
            <Label>Tipo de Transporte</Label>
            <RadioGroup 
              value={tipoTransporte} 
              onValueChange={(v) => setTipoTransporte(v as 'Camión' | 'Ferroviaria')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Camión" id="camion" />
                <Label htmlFor="camion" className="flex items-center gap-2 cursor-pointer">
                  <Truck className="h-4 w-4" />
                  Camión
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Ferroviaria" id="ferroviaria" />
                <Label htmlFor="ferroviaria" className="flex items-center gap-2 cursor-pointer">
                  <Train className="h-4 w-4" />
                  Ferroviaria
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Producto */}
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={productoId} onValueChange={setProductoId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Select value={proveedorId} onValueChange={setProveedorId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.empresa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chofer */}
          <div className="space-y-2">
            <Label>{tipoTransporte === 'Ferroviaria' ? 'Operador' : 'Chofer'}</Label>
            <Input 
              value={chofer}
              onChange={(e) => setChofer(e.target.value)}
              placeholder={tipoTransporte === 'Ferroviaria' ? 'Nombre del operador' : 'Nombre del chofer'}
            />
          </div>

          {/* Placas / Número de Carro */}
          <div className="space-y-2">
            <Label>{tipoTransporte === 'Ferroviaria' ? 'Número de Carro' : 'Placas'}</Label>
            <Input 
              value={placas}
              onChange={(e) => setPlacas(e.target.value)}
              placeholder={tipoTransporte === 'Ferroviaria' ? 'Ej: GFRX-12345' : 'Ej: ABC-123-A'}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleCrear} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Operación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NuevaOperacionDialog;
