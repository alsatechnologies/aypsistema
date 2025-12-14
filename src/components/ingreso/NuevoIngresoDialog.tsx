import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, User, FileText } from 'lucide-react';

export type MotivoVisita = 'Reciba' | 'Embarque';

export interface NuevoIngresoData {
  nombreChofer: string;
  empresa: string;
  vehiculo: string;
  placas: string;
  motivo: MotivoVisita;
  procedenciaDestino: string;
  ubicacion: string;
}

interface NuevoIngresoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NuevoIngresoData) => void;
}

const NuevoIngresoDialog: React.FC<NuevoIngresoDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState<NuevoIngresoData>({
    nombreChofer: '',
    empresa: '',
    vehiculo: '',
    placas: '',
    motivo: 'Reciba',
    procedenciaDestino: '',
    ubicacion: '',
  });


  const handleChange = (field: keyof NuevoIngresoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validaciones básicas
    if (!formData.nombreChofer.trim()) {
      toast.error('El nombre del chofer es requerido');
      return;
    }
    if (!formData.placas.trim()) {
      toast.error('Las placas son requeridas');
      return;
    }
    if (!formData.motivo) {
      toast.error('El motivo de visita es requerido');
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      nombreChofer: '',
      empresa: '',
      vehiculo: '',
      placas: '',
      motivo: 'Reciba',
      procedenciaDestino: '',
      ubicacion: '',
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Registrar Ingreso
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Motivo de Visita - Primero para condicionar campos */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Motivo de Visita
            </Label>
            <Select 
              value={formData.motivo} 
              onValueChange={(v) => handleChange('motivo', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reciba">Reciba (Báscula)</SelectItem>
                <SelectItem value="Embarque">Embarque (Báscula)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datos del Conductor */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos del Conductor
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Chofer *</Label>
                <Input 
                  placeholder="Nombre completo" 
                  value={formData.nombreChofer}
                  onChange={(e) => handleChange('nombreChofer', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa / Línea Transportista</Label>
                <Input 
                  placeholder="Nombre de la empresa" 
                  value={formData.empresa}
                  onChange={(e) => handleChange('empresa', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Datos del Vehículo */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Datos del Vehículo
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Vehículo</Label>
                <Select 
                  value={formData.vehiculo} 
                  onValueChange={(v) => handleChange('vehiculo', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tractocamión">Tractocamión</SelectItem>
                    <SelectItem value="Pipa">Pipa</SelectItem>
                    <SelectItem value="Torton">Torton</SelectItem>
                    <SelectItem value="Camioneta">Camioneta</SelectItem>
                    <SelectItem value="Contenedor">Contenedor</SelectItem>
                    <SelectItem value="Ferrocarril">Ferrocarril</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Placas *</Label>
                <Input 
                  placeholder="ABC-123-A" 
                  value={formData.placas}
                  onChange={(e) => handleChange('placas', e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Procedencia / Destino</Label>
              <Input 
                placeholder="Ej: Guadalajara, JAL" 
                value={formData.procedenciaDestino}
                onChange={(e) => handleChange('procedenciaDestino', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Registrar Ingreso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NuevoIngresoDialog;
