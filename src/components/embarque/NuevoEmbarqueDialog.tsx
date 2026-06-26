import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Truck, Train, Plus, Ship, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Producto } from '@/services/supabase/productos';
import type { Cliente } from '@/services/supabase/clientes';

interface NuevoEmbarqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrear: (embarque: {
    productoId: number;
    clienteId: number;
    destino: string;
    chofer: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
    tipoEmbarque: 'Nacional' | 'Exportación';
    fecha?: string;
    hora?: string;
  }) => void;
  productos: Producto[];
  clientes: Cliente[];
}

const todayISO = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);

const NuevoEmbarqueDialog = ({ open, onOpenChange, onCrear, productos, clientes }: NuevoEmbarqueDialogProps) => {
  const [tipoTransporte, setTipoTransporte] = useState<'Camión' | 'Ferroviaria'>('Camión');
  const [tipoEmbarque, setTipoEmbarque] = useState<'Nacional' | 'Exportación'>('Nacional');
  const [productoId, setProductoId] = useState<string>('');
  const [clienteId, setClienteId] = useState<string>('');
  const [destino, setDestino] = useState('');
  const [chofer, setChofer] = useState('');
  const [usarFechaPersonalizada, setUsarFechaPersonalizada] = useState(false);
  const [fechaPersonalizada, setFechaPersonalizada] = useState(todayISO());
  const [horaPersonalizada, setHoraPersonalizada] = useState(nowTime());

  const handleCrear = () => {
    if (!productoId || !clienteId || !destino || !chofer) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    if (usarFechaPersonalizada && !fechaPersonalizada) {
      toast.error('Selecciona una fecha');
      return;
    }

    onCrear({
      productoId: parseInt(productoId),
      clienteId: parseInt(clienteId),
      destino,
      chofer,
      tipoTransporte,
      tipoEmbarque,
      fecha: usarFechaPersonalizada ? fechaPersonalizada : undefined,
      hora: usarFechaPersonalizada ? horaPersonalizada : undefined,
    });

    // Reset form
    setProductoId('');
    setClienteId('');
    setDestino('');
    setChofer('');
    setTipoTransporte('Camión');
    setTipoEmbarque('Nacional');
    setUsarFechaPersonalizada(false);
    setFechaPersonalizada(todayISO());
    setHoraPersonalizada(nowTime());
    onOpenChange(false);
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

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.empresa}</SelectItem>
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

          {/* Fecha personalizada */}
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 cursor-pointer" htmlFor="fecha-custom-embarque">
                <Calendar className="h-4 w-4" />
                Fecha/hora personalizada
              </Label>
              <Switch
                id="fecha-custom-embarque"
                checked={usarFechaPersonalizada}
                onCheckedChange={setUsarFechaPersonalizada}
              />
            </div>
            {usarFechaPersonalizada && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fecha</Label>
                  <Input
                    type="date"
                    value={fechaPersonalizada}
                    onChange={(e) => setFechaPersonalizada(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Hora</Label>
                  <Input
                    type="time"
                    value={horaPersonalizada}
                    onChange={(e) => setHoraPersonalizada(e.target.value)}
                  />
                </div>
              </div>
            )}
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
