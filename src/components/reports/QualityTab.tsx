
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const QualityTab = () => {
  // Sample data for product quality
  const qualityData = [
    { name: 'Humedad', excelente: 20, buena: 30, regular: 40, mala: 10 },
    { name: 'Impureza', excelente: 15, buena: 25, regular: 45, mala: 15 },
    { name: 'Aceite', excelente: 30, buena: 40, regular: 20, mala: 10 },
    { name: 'Grano Dañado', excelente: 10, buena: 20, regular: 40, mala: 30 },
  ];
  
  const config = {
    good: { label: "Excelente", theme: { light: "#4ade80", dark: "#4ade80" } },
    average: { label: "Buena", theme: { light: "#facc15", dark: "#facc15" } },
    poor: { label: "Regular", theme: { light: "#fb923c", dark: "#fb923c" } },
    bad: { label: "Mala", theme: { light: "#f87171", dark: "#f87171" } },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Calidad</CardTitle>
        <CardDescription>Distribución de calidad por diferentes parámetros</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-96" config={config}>
          <BarChart data={qualityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="excelente" stackId="a" fill="#4ade80" />
            <Bar dataKey="buena" stackId="a" fill="#facc15" />
            <Bar dataKey="regular" stackId="a" fill="#fb923c" />
            <Bar dataKey="mala" stackId="a" fill="#f87171" />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Basado en muestras de los últimos 3 meses
      </CardFooter>
    </Card>
  );
};

export default QualityTab;
