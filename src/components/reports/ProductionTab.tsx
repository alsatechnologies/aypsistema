
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Wheat, Bean, Flower2, Globe, Sprout } from 'lucide-react';
import TankDisplay from './TankDisplay';

const ProductionTab = () => {
  const [showTanques, setShowTanques] = useState(false);
  const [tanqueValues, setTanqueValues] = useState([5, 7, 3, 8]);
  
  // Product data for production tab
  const productos = [
    { name: 'Semilla de Maíz', icon: Wheat, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { name: 'Semilla de Soya', icon: Bean, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Semilla de Cártamo', icon: Flower2, color: 'bg-orange-500 hover:bg-orange-600' },
    { name: 'Aceite de Cártamo', icon: Globe, color: 'bg-red-500 hover:bg-red-600' },
    { name: 'Semilla de Garbanzo', icon: Sprout, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { name: 'Semilla de Girasol', icon: Package, color: 'bg-amber-500 hover:bg-amber-600' },
  ];

  const handleProductClick = (productName: string) => {
    console.log(`Producto seleccionado: ${productName}`);
    if (productName === 'Aceite de Cártamo') {
      setShowTanques(true);
    }
  };

  const handleTanqueChange = (index: number, value: number[]) => {
    const newValues = [...tanqueValues];
    newValues[index] = value[0];
    setTanqueValues(newValues);
  };

  const handleBackToProducts = () => {
    setShowTanques(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {showTanques ? 'Tanques de Aceite de Cártamo' : 'Producción por Producto'}
        </CardTitle>
        <CardDescription>
          {showTanques
            ? 'Niveles de los tanques de almacenamiento'
            : 'Selecciona un producto para ver sus métricas de producción'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showTanques ? (
          <TankDisplay 
            tanqueValues={tanqueValues}
            onTanqueChange={handleTanqueChange}
            onBackToProducts={handleBackToProducts}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((producto, index) => {
              const IconComponent = producto.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${producto.color} text-white border-0`}
                  onClick={() => handleProductClick(producto.name)}
                >
                  <IconComponent size={32} />
                  <span className="text-sm font-medium text-center">{producto.name}</span>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {showTanques
          ? 'Ajusta los niveles de cada tanque usando los controles deslizantes'
          : 'Haz clic en un producto para ver detalles de producción'
        }
      </CardFooter>
    </Card>
  );
};

export default ProductionTab;
