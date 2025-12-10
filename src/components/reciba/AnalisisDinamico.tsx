import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AnalisisConfig, getProductoAnalisis } from '@/utils/productAnalysis';

interface AnalisisDinamicoProps {
  producto: string;
  valores: Record<string, number>;
  onChange: (nombre: string, valor: number) => void;
}

const AnalisisDinamico: React.FC<AnalisisDinamicoProps> = ({ producto, valores, onChange }) => {
  const analisis = getProductoAnalisis(producto);

  if (analisis.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No hay análisis configurados para este producto
      </div>
    );
  }

  const getValorStatus = (config: AnalisisConfig, valor: number) => {
    if (!valor) return 'neutral';
    if (config.rangoMax !== undefined && valor > config.rangoMax) return 'error';
    if (config.tolerancia !== undefined && valor > config.tolerancia) return 'warning';
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
      {analisis.map((config) => {
        const valor = valores[config.nombre] || 0;
        const status = getValorStatus(config, valor);
        
        return (
          <div 
            key={config.nombre} 
            className={`space-y-2 p-3 rounded-lg border ${getStatusColor(status)}`}
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{config.nombre}</Label>
              {config.descuento && (
                <Badge variant="outline" className="text-xs">Descuento</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="0.0"
                value={valor || ''}
                onChange={(e) => onChange(config.nombre, parseFloat(e.target.value) || 0)}
                className="text-center"
              />
              <span className="text-sm text-muted-foreground w-12">{config.unidad}</span>
            </div>
            {config.rangoMin !== undefined && config.rangoMax !== undefined && (
              <p className="text-xs text-muted-foreground">
                Rango: {config.rangoMin} - {config.rangoMax}{config.unidad}
                {config.tolerancia !== undefined && (
                  <span className="block">Tolerancia: {config.tolerancia}{config.unidad}</span>
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnalisisDinamico;
