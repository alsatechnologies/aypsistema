import React from 'react';
import { Separator } from '@/components/ui/separator';
import { calcularDescuentosTotales, calcularPesoNetoFinal, getProductoAnalisis } from '@/utils/productAnalysis';

interface DescuentosPanelProps {
  producto: string;
  valoresAnalisis: Record<string, number>;
  pesoNeto: number;
}

const DescuentosPanel: React.FC<DescuentosPanelProps> = ({ producto, valoresAnalisis, pesoNeto }) => {
  const { descuentos, totalDescuento } = calcularDescuentosTotales(producto, valoresAnalisis);
  const pesoNetoFinal = calcularPesoNetoFinal(pesoNeto, totalDescuento);
  const analisis = getProductoAnalisis(producto);
  
  const descuentosActivos = analisis.filter(a => a.descuento);
  const formatNumber = (num: number) => num.toLocaleString('es-MX', { maximumFractionDigits: 2 });

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <h5 className="font-medium text-sm">Descuentos Aplicados</h5>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {descuentosActivos.map((config) => {
          const descuento = descuentos[config.nombre] || 0;
          return (
            <div key={config.nombre} className="flex justify-between items-center">
              <span className="text-muted-foreground">{config.nombre}:</span>
              <span className={`font-medium ${descuento > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {descuento > 0 ? `-${formatNumber(descuento)}%` : '0%'}
              </span>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Descuento:</span>
          <span className={`font-bold ${totalDescuento > 0 ? 'text-destructive' : ''}`}>
            {totalDescuento > 0 ? `-${formatNumber(totalDescuento)}%` : '0%'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Descuento en Kg:</span>
          <span className={`font-bold ${totalDescuento > 0 ? 'text-destructive' : ''}`}>
            {totalDescuento > 0 ? `-${formatNumber((pesoNeto * totalDescuento) / 100)}` : '0'} Kg
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center text-lg">
        <span className="font-bold">Peso Neto Final:</span>
        <span className="font-bold text-primary text-xl">
          {formatNumber(pesoNetoFinal)} Kg
        </span>
      </div>
    </div>
  );
};

export default DescuentosPanel;
