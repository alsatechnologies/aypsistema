import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface AnalisisItem {
  id: string | number;
  nombre: string;
  generaDescuento: boolean;
  rangosDescuento?: Array<{ porcentaje: number; kgDescuentoTon: number }>;
}

interface AnalisisDinamicoProps {
  analisis: AnalisisItem[]; // Análisis del producto desde Supabase
  valores: Record<string, number>;
  onChange: (nombre: string, valor: number) => void;
}

const AnalisisDinamico: React.FC<AnalisisDinamicoProps> = ({ analisis, valores, onChange }) => {

  if (!analisis || analisis.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No hay análisis configurados para este producto
      </div>
    );
  }

  const getValorStatus = (item: AnalisisItem, valor: number) => {
    if (!valor) return 'neutral';
    // Verificar rangos si existen
    const tieneRangos = item.rangosDescuento && item.rangosDescuento.length > 0;
    if (tieneRangos) {
      const maxRango = Math.max(...item.rangosDescuento.map(r => r.porcentaje));
      if (valor > maxRango) return 'error';
      // Encontrar el primer rango que exceda
      const rangoExcedido = item.rangosDescuento.find(r => valor > r.porcentaje);
      if (rangoExcedido) return 'warning';
    }
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'border-green-300 bg-green-50';
      case 'warning': return 'border-yellow-300 bg-yellow-50';
      case 'error': return 'border-red-300 bg-red-50';
      default: return '';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {analisis.map((item) => {
        const nombreAnalisis = item.nombre;
        const valor = valores[nombreAnalisis] || 0;
        const status = getValorStatus(item, valor);
        
        return (
          <div 
            key={item.id} 
            className={`space-y-2 p-3 rounded-lg border ${getStatusColor(status)}`}
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{nombreAnalisis}</Label>
              {item.generaDescuento && (
                <Badge variant="outline" className="text-xs">Descuento</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="0.0"
                value={valor || ''}
                onChange={(e) => onChange(nombreAnalisis, parseFloat(e.target.value) || 0)}
                className="text-center"
              />
              <span className="text-sm text-muted-foreground w-12">%</span>
            </div>
            {item.rangosDescuento && item.rangosDescuento.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Rangos: {item.rangosDescuento.map(r => `${r.porcentaje}%`).join(', ')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnalisisDinamico;
