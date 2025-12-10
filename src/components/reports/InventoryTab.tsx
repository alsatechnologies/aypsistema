
import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const InventoryTab = () => {
  // Sample data for inventory by product
  const inventoryData = [
    { name: 'Semilla de maíz', cantidad: 1200, value: 1200 },
    { name: 'Semilla de soya', cantidad: 800, value: 800 },
    { name: 'Semilla de cártamo', cantidad: 600, value: 600 },
    { name: 'Aceite de cártamo', cantidad: 400, value: 400 },
    { name: 'Semilla de garbanzo', cantidad: 300, value: 300 },
  ];
  
  // Sample data for monthly receptions
  const receptionData = [
    { name: 'Ene', recepciones: 65 },
    { name: 'Feb', recepciones: 59 },
    { name: 'Mar', recepciones: 80 },
    { name: 'Abr', recepciones: 81 },
    { name: 'May', recepciones: 56 },
    { name: 'Jun', recepciones: 55 },
    { name: 'Jul', recepciones: 40 },
  ];
  
  // Colors for pie chart
  const COLORS = ['#6f2237', '#FFC658', '#82ca9d', '#8884d8', '#83a6ed'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventario por Producto</CardTitle>
          <CardDescription>Distribución del inventario actual por tipo de producto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="70%"
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Actualizado el {new Date().toLocaleDateString()}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de Inventario</CardTitle>
          <CardDescription>Entradas y salidas registradas en los últimos 30 días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={receptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="recepciones" stroke="#6f2237" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Actualizado el {new Date().toLocaleDateString()}
        </CardFooter>
      </Card>
    </div>
  );
};

export default InventoryTab;
