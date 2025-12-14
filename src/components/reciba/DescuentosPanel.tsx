import React from 'react';
import { Separator } from '@/components/ui/separator';

interface AnalisisItem {
  id: string | number;
  nombre: string;
  generaDescuento: boolean;
  rangosDescuento?: Array<{ porcentaje: number; kgDescuentoTon: number }>;
}

interface DescuentosPanelProps {
  analisis: AnalisisItem[]; // Análisis del producto desde Supabase
  valoresAnalisis: Record<string, number>;
  pesoNeto: number;
}

// Calcular descuento basado en rangos de Supabase
// Los rangos indican: si el valor >= porcentaje, se aplica kgDescuentoTon por tonelada
const calcularDescuentoPorRangos = (
  valor: number,
  rangosDescuento?: Array<{ porcentaje: number; kgDescuentoTon: number }>
): number => {
  if (!rangosDescuento || rangosDescuento.length === 0 || !valor) return 0;
  
  // Ordenar rangos por porcentaje descendente para encontrar el rango más alto que se cumple
  const rangosOrdenados = [...rangosDescuento].sort((a, b) => b.porcentaje - a.porcentaje);
  
  // Encontrar el primer rango donde el valor >= porcentaje
  const rangoAplicable = rangosOrdenados.find(rango => valor >= rango.porcentaje);
  
  return rangoAplicable ? rangoAplicable.kgDescuentoTon : 0;
};

const DescuentosPanel: React.FC<DescuentosPanelProps> = ({ analisis, valoresAnalisis, pesoNeto }) => {
  const formatNumber = (num: number) => num.toLocaleString('es-MX', { maximumFractionDigits: 2 });
  
  // Calcular descuentos para cada análisis que genera descuento
  const descuentosActivos = analisis.filter(a => a.generaDescuento);
  const descuentosKg: Record<string, number> = {};
  let totalDescuentoKg = 0;
  
  descuentosActivos.forEach(item => {
    const valor = valoresAnalisis[item.nombre] || 0;
    const descuentoKgPorTon = calcularDescuentoPorRangos(valor, item.rangosDescuento);
    // Convertir kg por tonelada a kg totales (pesoNeto está en kg, dividir por 1000 para toneladas)
    const descuentoKg = (descuentoKgPorTon * pesoNeto) / 1000;
    descuentosKg[item.nombre] = descuentoKg;
    totalDescuentoKg += descuentoKg;
  });
  
  // Calcular porcentaje total de descuento
  const totalDescuentoPorcentaje = pesoNeto > 0 ? (totalDescuentoKg / pesoNeto) * 100 : 0;
  const pesoNetoFinal = Math.max(0, pesoNeto - totalDescuentoKg);

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <h5 className="font-medium text-sm">Descuentos Aplicados</h5>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {descuentosActivos.map((item) => {
          const descuentoKg = descuentosKg[item.nombre] || 0;
          const valor = valoresAnalisis[item.nombre] || 0;
          const descuentoKgPorTon = calcularDescuentoPorRangos(valor, item.rangosDescuento);
          return (
            <div key={item.id} className="flex justify-between items-center">
              <span className="text-muted-foreground">{item.nombre}:</span>
              <span className={`font-medium ${descuentoKg > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {descuentoKg > 0 ? `-${formatNumber(descuentoKg)} kg` : `${descuentoKgPorTon} kg/ton`}
              </span>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Descuento:</span>
          <span className={`font-bold ${totalDescuentoPorcentaje > 0 ? 'text-destructive' : ''}`}>
            {totalDescuentoPorcentaje > 0 ? `-${formatNumber(totalDescuentoPorcentaje)}%` : '0%'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Descuento en Kg:</span>
          <span className={`font-bold ${totalDescuentoKg > 0 ? 'text-destructive' : ''}`}>
            {totalDescuentoKg > 0 ? `-${formatNumber(totalDescuentoKg)}` : '0'} Kg
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
