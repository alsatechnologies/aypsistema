
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const ReceptionTab = () => {
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
  
  const config = {
    good: { label: "Excelente", theme: { light: "#4ade80", dark: "#4ade80" } },
    average: { label: "Buena", theme: { light: "#facc15", dark: "#facc15" } },
    poor: { label: "Regular", theme: { light: "#fb923c", dark: "#fb923c" } },
    bad: { label: "Mala", theme: { light: "#f87171", dark: "#f87171" } },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recepciones Mensuales</CardTitle>
        <CardDescription>Cantidad de recepciones registradas por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-80" config={config}>
          <BarChart data={receptionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="recepciones" fill="#6f2237" />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Datos acumulados del año actual
      </CardFooter>
    </Card>
  );
};

export default ReceptionTab;
