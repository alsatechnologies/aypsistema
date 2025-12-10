import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, User, Building, FileText } from 'lucide-react';

export type MotivoVisita = 'Reciba' | 'Embarque' | 'Visita' | 'Proveedor';

export interface NuevoIngresoData {
  nombreChofer: string;
  empresa: string;
  vehiculo: string;
  placas: string;
  motivo: MotivoVisita;
  procedenciaDestino: string;
  ubicacion: string;
  // Campos adicionales para Báscula (Reciba/Embarque)
  producto?: string;
  cliente?: string;
  proveedor?: string;
  tipoTransporte?: 'Camión' | 'Ferroviaria';
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
    motivo: 'Visita',
    procedenciaDestino: '',
    ubicacion: '',
  });

  // Determinar si el motivo requiere campos de Báscula
  const esBascula = formData.motivo === 'Reciba' || formData.motivo === 'Embarque';

  // Resetear campos adicionales cuando cambia el motivo
  useEffect(() => {
    if (!esBascula) {
      setFormData(prev => ({
        ...prev,
        producto: undefined,
        cliente: undefined,
        proveedor: undefined,
        tipoTransporte: undefined,
      }));
    }
  }, [formData.motivo, esBascula]);

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

    // Validaciones adicionales para Báscula
    if (esBascula) {
      if (!formData.producto) {
        toast.error('El producto es requerido para operaciones de báscula');
        return;
      }
      if (formData.motivo === 'Reciba' && !formData.proveedor) {
        toast.error('El proveedor es requerido para Reciba');
        return;
      }
      if (formData.motivo === 'Embarque' && !formData.cliente) {
        toast.error('El cliente es requerido para Embarque');
        return;
      }
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      nombreChofer: '',
      empresa: '',
      vehiculo: '',
      placas: '',
      motivo: 'Visita',
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
                <SelectItem value="Visita">Visita General</SelectItem>
                <SelectItem value="Proveedor">Proveedor de Servicios</SelectItem>
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

          {/* Campos adicionales para Báscula (Reciba/Embarque) */}
          {esBascula && (
            <div className="border rounded-lg p-4 space-y-4 bg-primary/5 border-primary/20">
              <h4 className="font-medium flex items-center gap-2 text-primary">
                <Building className="h-4 w-4" />
                Datos para Báscula ({formData.motivo})
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Transporte *</Label>
                  <Select 
                    value={formData.tipoTransporte} 
                    onValueChange={(v) => handleChange('tipoTransporte', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Camión">Camión</SelectItem>
                      <SelectItem value="Ferroviaria">Ferroviaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select 
                    value={formData.producto} 
                    onValueChange={(v) => handleChange('producto', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aceite Crudo de Soya">Aceite Crudo de Soya</SelectItem>
                      <SelectItem value="Pasta de Soya">Pasta de Soya</SelectItem>
                      <SelectItem value="Frijol Soya">Frijol Soya</SelectItem>
                      <SelectItem value="Cascarilla de Soya">Cascarilla de Soya</SelectItem>
                      <SelectItem value="Aceite Refinado">Aceite Refinado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.motivo === 'Reciba' && (
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Select 
                    value={formData.proveedor} 
                    onValueChange={(v) => handleChange('proveedor', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oleaginosas del Bajío">Oleaginosas del Bajío</SelectItem>
                      <SelectItem value="Granos del Norte">Granos del Norte</SelectItem>
                      <SelectItem value="Aceites Industriales">Aceites Industriales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.motivo === 'Embarque' && (
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select 
                    value={formData.cliente} 
                    onValueChange={(v) => handleChange('cliente', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aceites del Pacífico SA">Aceites del Pacífico SA</SelectItem>
                      <SelectItem value="Alimentos Balanceados MX">Alimentos Balanceados MX</SelectItem>
                      <SelectItem value="Export Foods Inc.">Export Foods Inc.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <p className="text-sm text-muted-foreground italic">
                * Este registro se enviará automáticamente a Oficina para generar la orden de báscula
              </p>
            </div>
          )}

          {/* Ubicación */}
          <div className="space-y-2">
            <Label>Ubicación Asignada</Label>
            <Select 
              value={formData.ubicacion} 
              onValueChange={(v) => handleChange('ubicacion', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Asignar ubicación" />
              </SelectTrigger>
              <SelectContent>
                {esBascula ? (
                  <>
                    <SelectItem value="Báscula Camión">Báscula Camión</SelectItem>
                    <SelectItem value="Báscula Ferroviaria">Báscula Ferroviaria</SelectItem>
                    <SelectItem value="Patio de espera">Patio de espera</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Oficinas">Oficinas</SelectItem>
                    <SelectItem value="Almacén">Almacén</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Patio">Patio</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
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
