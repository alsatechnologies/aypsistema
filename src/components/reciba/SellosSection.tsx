import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Unlock } from 'lucide-react';

interface SellosData {
  selloEntrada1: string;
  selloEntrada2: string;
  selloSalida1: string;
  selloSalida2: string;
}

interface SellosSectionProps {
  sellos: SellosData;
  onChange: (sellos: SellosData) => void;
  readOnlyEntrada?: boolean;
  simple?: boolean; // Si es true, muestra solo 4 campos simples sin grupos
}

const SellosSection: React.FC<SellosSectionProps> = ({ sellos, onChange, readOnlyEntrada = false, simple = false }) => {
  const handleChange = (field: keyof SellosData, value: string) => {
    onChange({ ...sellos, [field]: value.toUpperCase() });
  };

  // Modo simple: solo 4 campos numerados en una fila
  if (simple) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Sello 1</Label>
          <Input 
            placeholder="XXX-000" 
            value={sellos.selloEntrada1}
            onChange={(e) => handleChange('selloEntrada1', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sello 2</Label>
          <Input 
            placeholder="XXX-000" 
            value={sellos.selloEntrada2}
            onChange={(e) => handleChange('selloEntrada2', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sello 3</Label>
          <Input 
            placeholder="XXX-000" 
            value={sellos.selloSalida1}
            onChange={(e) => handleChange('selloSalida1', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sello 4</Label>
          <Input 
            placeholder="XXX-000" 
            value={sellos.selloSalida2}
            onChange={(e) => handleChange('selloSalida2', e.target.value)}
          />
        </div>
      </div>
    );
  }

  // Modo normal: con grupos de entrada/salida
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Sellos de Entrada */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-green-600" />
          <h5 className="font-medium text-sm">Sellos de Entrada</h5>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Sello 1</Label>
            <Input 
              placeholder="XXX-000" 
              value={sellos.selloEntrada1}
              onChange={(e) => handleChange('selloEntrada1', e.target.value)}
              readOnly={readOnlyEntrada}
              className={readOnlyEntrada ? 'bg-muted' : ''}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sello 2</Label>
            <Input 
              placeholder="XXX-000" 
              value={sellos.selloEntrada2}
              onChange={(e) => handleChange('selloEntrada2', e.target.value)}
              readOnly={readOnlyEntrada}
              className={readOnlyEntrada ? 'bg-muted' : ''}
            />
          </div>
        </div>
      </div>

      {/* Sellos de Salida */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Unlock className="h-4 w-4 text-orange-600" />
          <h5 className="font-medium text-sm">Sellos de Salida</h5>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Sello 1</Label>
            <Input 
              placeholder="XXX-000" 
              value={sellos.selloSalida1}
              onChange={(e) => handleChange('selloSalida1', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sello 2</Label>
            <Input 
              placeholder="XXX-000" 
              value={sellos.selloSalida2}
              onChange={(e) => handleChange('selloSalida2', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellosSection;
