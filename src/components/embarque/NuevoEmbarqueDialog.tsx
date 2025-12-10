import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Train, Plus, Ship } from 'lucide-react';
import { toast } from 'sonner';

interface NuevoEmbarqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrear: (embarque: {
    producto: string;
    cliente: string;
    destino: string;
    chofer: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
    tipoEmbarque: 'Nacional' | 'Exportación';
  }) => void;
}

const NuevoEmbarqueDialog = ({ open, onOpenChange, onCrear }: NuevoEmbarqueDialogProps) => {
  const [tipoTransporte, setTipoTransporte] = useState<'Camión' | 'Ferroviaria'>('Camión');
  const [tipoEmbarque, setTipoEmbarque] = useState<'Nacional' | 'Exportación'>('Nacional');
  const [producto, setProducto] = useState('');
  const [cliente, setCliente] = useState('');
  const [destino, setDestino] = useState('');
  const [chofer, setChofer] = useState('');

  const productos = ['Aceite Crudo de Soya', 'Pasta de Soya', 'Cascarilla de Soya', 'Aceite Refinado'];
  const clientes = ['Aceites del Pacífico SA', 'Alimentos Balanceados MX', 'Industrias Graseras', 'Export Foods Inc.'];

  const handleCrear = () => {
    if (!producto || !cliente || !destino || !chofer) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    onCrear({
      producto,
      cliente,
      destino,
      chofer,
      tipoTransporte,
      tipoEmbarque
    });

    // Reset form
    setProducto('');
    setCliente('');
    setDestino('');
    setChofer('');
    setTipoTransporte('Camión');
    setTipoEmbarque('Nacional');
    onOpenChange(false);
    toast.success('Embarque creado correctamente');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Nuevo Embarque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Embarque */}
          <div className="space-y-2">
            <Label>Tipo de Embarque</Label>
            <RadioGroup 
              value={tipoEmbarque} 
              onValueChange={(v) => setTipoEmbarque(v as 'Nacional' | 'Exportación')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Nacional" id="nacional" />
                <Label htmlFor="nacional" className="cursor-pointer">Nacional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Exportación" id="exportacion" />
                <Label htmlFor="exportacion" className="cursor-pointer">Exportación</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tipo de Transporte */}
          <div className="space-y-2">
            <Label>Tipo de Transporte</Label>
            <RadioGroup 
              value={tipoTransporte} 
              onValueChange={(v) => setTipoTransporte(v as 'Camión' | 'Ferroviaria')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Camión" id="camion-emb" />
                <Label htmlFor="camion-emb" className="flex items-center gap-2 cursor-pointer">
                  <Truck className="h-4 w-4" />
                  Camión
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Ferroviaria" id="ferroviaria-emb" />
                <Label htmlFor="ferroviaria-emb" className="flex items-center gap-2 cursor-pointer">
                  <Train className="h-4 w-4" />
                  Ferroviaria
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Producto */}
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={producto} onValueChange={setProducto}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={cliente} onValueChange={setCliente}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label>Destino</Label>
            <Input 
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ej: Guadalajara, JAL"
            />
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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleCrear} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Embarque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoEmbarqueDialog;
