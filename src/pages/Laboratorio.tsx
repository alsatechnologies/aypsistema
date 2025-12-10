import React from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FlaskConical, Beaker, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Laboratorio = () => {
  const muestras = [
    { id: 'LAB-001', fecha: '2024-12-10', tipo: 'Materia Prima', muestra: 'Aceite Crudo', analista: 'Juan Pérez', estado: 'En análisis' },
    { id: 'LAB-002', fecha: '2024-12-09', tipo: 'Producto Terminado', muestra: 'Aceite Refinado', analista: 'María García', estado: 'Completado' },
    { id: 'LAB-003', fecha: '2024-12-08', tipo: 'Materia Prima', muestra: 'Soya en Grano', analista: 'Carlos López', estado: 'Pendiente' },
    { id: 'LAB-004', fecha: '2024-12-07', tipo: 'Producto Terminado', muestra: 'Lecitina', analista: 'Ana Martínez', estado: 'Completado' },
  ];

  const equipos = [
    { nombre: 'Espectrofotómetro UV-Vis', estado: 'Disponible', ultimaCalibracion: '2024-12-01' },
    { nombre: 'Cromatógrafo de Gases', estado: 'En uso', ultimaCalibracion: '2024-11-15' },
    { nombre: 'Analizador de Humedad', estado: 'Disponible', ultimaCalibracion: '2024-12-05' },
    { nombre: 'pH-metro Digital', estado: 'Mantenimiento', ultimaCalibracion: '2024-11-20' },
  ];

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      'Completado': 'default',
      'En análisis': 'secondary',
      'Pendiente': 'outline',
      'Disponible': 'default',
      'En uso': 'secondary',
      'Mantenimiento': 'destructive',
    };
    return <Badge variant={variants[estado] || 'outline'}>{estado}</Badge>;
  };

  return (
    <Layout>
      <Header title="Laboratorio" subtitle="Gestión de análisis y equipos de laboratorio" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Muestras Pendientes</CardTitle>
              <Beaker className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">15</div>
              <p className="text-xs text-muted-foreground mt-1">+5 hoy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Análisis Completados</CardTitle>
              <FlaskConical className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">128</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Certificados Emitidos</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">42</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="muestras" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="muestras">Muestras</TabsTrigger>
            <TabsTrigger value="equipos">Equipos</TabsTrigger>
          </TabsList>

          <TabsContent value="muestras">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar muestras..." className="pl-10" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <Button className="bg-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Muestra
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Registro de Muestras</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Muestra</TableHead>
                      <TableHead>Analista</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {muestras.map((muestra) => (
                      <TableRow key={muestra.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{muestra.id}</TableCell>
                        <TableCell>{muestra.fecha}</TableCell>
                        <TableCell>{muestra.tipo}</TableCell>
                        <TableCell>{muestra.muestra}</TableCell>
                        <TableCell>{muestra.analista}</TableCell>
                        <TableCell>{getEstadoBadge(muestra.estado)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipos">
            <Card>
              <CardHeader>
                <CardTitle>Equipos de Laboratorio</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Calibración</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipos.map((equipo, index) => (
                      <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{equipo.nombre}</TableCell>
                        <TableCell>{getEstadoBadge(equipo.estado)}</TableCell>
                        <TableCell>{equipo.ultimaCalibracion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Laboratorio;
