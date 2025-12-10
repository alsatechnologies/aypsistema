import React from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ControlCalidad = () => {
  const controles = [
    { id: 'QC-001', fecha: '2024-12-10', lote: 'LOT-2024-001', producto: 'Aceite de Soya', analisis: 'Acidez, Humedad', resultado: 'Aprobado' },
    { id: 'QC-002', fecha: '2024-12-09', lote: 'LOT-2024-002', producto: 'Proteína de Soya', analisis: 'Proteína, Humedad', resultado: 'Rechazado' },
    { id: 'QC-003', fecha: '2024-12-08', lote: 'LOT-2024-003', producto: 'Aceite de Girasol', analisis: 'Acidez, Color', resultado: 'Pendiente' },
    { id: 'QC-004', fecha: '2024-12-07', lote: 'LOT-2024-004', producto: 'Lecitina', analisis: 'Viscosidad, Color', resultado: 'Aprobado' },
  ];

  const stats = [
    { title: 'Análisis Hoy', value: '8', icon: Clock },
    { title: 'Aprobados', value: '45', icon: CheckCircle2 },
    { title: 'Rechazados', value: '3', icon: XCircle },
  ];

  const getResultadoBadge = (resultado: string) => {
    const config: Record<string, { variant: 'default' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      'Aprobado': { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      'Rechazado': { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      'Pendiente': { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
    };
    const { variant, icon } = config[resultado] || { variant: 'outline', icon: null };
    return <Badge variant={variant} className="flex items-center w-fit">{icon}{resultado}</Badge>;
  };

  return (
    <Layout>
      <Header title="Control de Calidad" subtitle="Gestión de análisis y controles de calidad" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar controles..." className="pl-10" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Control
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Controles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Análisis</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {controles.map((control) => (
                  <TableRow key={control.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{control.id}</TableCell>
                    <TableCell>{control.fecha}</TableCell>
                    <TableCell>{control.lote}</TableCell>
                    <TableCell>{control.producto}</TableCell>
                    <TableCell>{control.analisis}</TableCell>
                    <TableCell>{getResultadoBadge(control.resultado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ControlCalidad;
