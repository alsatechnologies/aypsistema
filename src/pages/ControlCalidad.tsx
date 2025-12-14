import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Lock, CheckCircle2, Settings, Building2, Package, Warehouse, Plus, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useLotes } from '@/services/hooks/useLotes';
import { useProductos } from '@/services/hooks/useProductos';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { useClientes } from '@/services/hooks/useClientes';
import { useProveedores } from '@/services/hooks/useProveedores';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Importar datos de Clientes y Proveedores (por ahora hardcodeados, luego desde Supabase)
// Estos se cargarán dinámicamente desde las páginas correspondientes o desde Supabase

// Estos datos vendrán de Supabase o del módulo de Configuración
// Por ahora usamos los mismos datos hardcodeados que Configuracion.tsx

interface MapeoOrigen {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'Cliente' | 'Proveedor' | 'Otros';
  cliente_id?: number | null;
  proveedor_id?: number | null;
  asignado: boolean;
}

interface MapeoProducto {
  id: number;
  codigo: string;
  nombre: string;
  codigoBoleta?: string;
  asignado: boolean;
}

interface MapeoAlmacen {
  id: number;
  codigo: string;
  nombre: string;
  asignado: boolean;
}

const ControlCalidad = () => {
  const { tiposOperacion, origenes, loading } = useLotes();
  const { productos, updateProducto, loadProductos } = useProductos();
  const { almacenes, updateAlmacen, loadAlmacenes } = useAlmacenes();
  const { clientes } = useClientes();
  const { proveedores } = useProveedores();
  
  const [searchOrigenes, setSearchOrigenes] = useState('');
  const [searchProductos, setSearchProductos] = useState('');
  const [searchAlmacenes, setSearchAlmacenes] = useState('');
  
  const [mapeosOrigenes, setMapeosOrigenes] = useState<MapeoOrigen[]>([]);
  const [mapeosProductos, setMapeosProductos] = useState<MapeoProducto[]>([]);
  const [mapeosAlmacenes, setMapeosAlmacenes] = useState<MapeoAlmacen[]>([]);
  
  const [editingOrigen, setEditingOrigen] = useState<MapeoOrigen | null>(null);
  const [editingProducto, setEditingProducto] = useState<MapeoProducto | null>(null);
  const [editingAlmacen, setEditingAlmacen] = useState<MapeoAlmacen | null>(null);
  
  const [codigoInput, setCodigoInput] = useState('');
  const [isImportarOrigenesDialogOpen, setIsImportarOrigenesDialogOpen] = useState(false);
  const [clientesDisponibles, setClientesDisponibles] = useState<any[]>([]);
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState<any[]>([]);
  const [origenesSeleccionados, setOrigenesSeleccionados] = useState<number[]>([]);

  // Cargar datos desde Supabase
  useEffect(() => {
    // Cargar clientes y proveedores disponibles
    if (clientes && clientes.length > 0) {
      setClientesDisponibles(clientes.map(c => ({ id: c.id, empresa: c.empresa })));
    }
    if (proveedores && proveedores.length > 0) {
      setProveedoresDisponibles(proveedores.map(p => ({ id: p.id, empresa: p.empresa })));
    }

    // Cargar origen "OTROS" por defecto
    const origenesData: MapeoOrigen[] = [
      { id: 999, codigo: '00', nombre: 'OTROS', tipo: 'Otros' as const, cliente_id: null, proveedor_id: null, asignado: true }
    ];
    setMapeosOrigenes(origenesData);
  }, [clientes, proveedores]);

  useEffect(() => {
    // Mapear productos desde Supabase
    if (productos && productos.length > 0) {
      const productosData: MapeoProducto[] = productos.map(p => ({
        id: p.id,
        codigo: p.codigo_lote || '',
        nombre: p.nombre,
        codigoBoleta: p.codigo_boleta,
        asignado: !!p.codigo_lote
      }));
      setMapeosProductos(productosData);
    } else {
      setMapeosProductos([]);
    }
  }, [productos]);

  useEffect(() => {
    // Mapear almacenes desde Supabase
    if (almacenes && almacenes.length > 0) {
      const almacenesData: MapeoAlmacen[] = almacenes.map(a => ({
        id: a.id,
        codigo: a.codigo_lote || '',
        nombre: a.nombre,
        asignado: !!a.codigo_lote
      }));
      setMapeosAlmacenes(almacenesData);
    } else {
      setMapeosAlmacenes([]);
    }
  }, [almacenes]);

  const handleAsignarCodigoOrigen = (origen: MapeoOrigen) => {
    if (origen.asignado) {
      toast.error('Este código ya está asignado y no se puede modificar');
      return;
    }
    setEditingOrigen(origen);
    setCodigoInput('');
  };

  const handleGuardarCodigoOrigen = () => {
    if (!editingOrigen || !codigoInput.trim()) {
      toast.error('Ingrese un código válido');
      return;
    }

    // Validar que el código no esté duplicado
    if (mapeosOrigenes.some(m => m.codigo === codigoInput.trim() && m.id !== editingOrigen.id)) {
      toast.error('Este código ya está asignado a otro origen');
      return;
    }

    setMapeosOrigenes(prev => prev.map(m => 
      m.id === editingOrigen.id 
        ? { ...m, codigo: codigoInput.trim(), asignado: true }
        : m
    ));
    
    toast.success('Código asignado correctamente');
    setEditingOrigen(null);
    setCodigoInput('');
  };

  const handleAsignarCodigoProducto = (producto: MapeoProducto) => {
    if (producto.asignado) {
      toast.error('Este código ya está asignado y no se puede modificar');
      return;
    }
    setEditingProducto(producto);
    setCodigoInput(producto.codigo || '');
  };

  const handleGuardarCodigoProducto = async () => {
    if (!editingProducto || !codigoInput.trim()) {
      toast.error('Ingrese un código válido');
      return;
    }

    if (mapeosProductos.some(m => m.codigo === codigoInput.trim() && m.id !== editingProducto.id)) {
      toast.error('Este código ya está asignado a otro producto');
      return;
    }

    try {
      await updateProducto(editingProducto.id, { codigo_lote: codigoInput.trim() });
      await loadProductos(); // Recargar productos para actualizar el estado
      toast.success('Código asignado correctamente');
      setEditingProducto(null);
      setCodigoInput('');
    } catch (error) {
      toast.error('Error al guardar el código');
      console.error(error);
    }
  };

  const handleAsignarCodigoAlmacen = (almacen: MapeoAlmacen) => {
    if (almacen.asignado) {
      toast.error('Este código ya está asignado y no se puede modificar');
      return;
    }
    setEditingAlmacen(almacen);
    setCodigoInput(almacen.codigo || '');
  };

  const handleGuardarCodigoAlmacen = async () => {
    if (!editingAlmacen || !codigoInput.trim()) {
      toast.error('Ingrese un código válido');
      return;
    }

    if (mapeosAlmacenes.some(m => m.codigo === codigoInput.trim() && m.id !== editingAlmacen.id)) {
      toast.error('Este código ya está asignado a otro almacén');
      return;
    }

    try {
      await updateAlmacen(editingAlmacen.id, { codigo_lote: codigoInput.trim() });
      await loadAlmacenes(); // Recargar almacenes para actualizar el estado
      toast.success('Código asignado correctamente');
      setEditingAlmacen(null);
      setCodigoInput('');
    } catch (error) {
      toast.error('Error al guardar el código');
      console.error(error);
    }
  };

  const handleImportarOrigenes = () => {
    setIsImportarOrigenesDialogOpen(true);
    setOrigenesSeleccionados([]);
  };

  const handleToggleOrigenSeleccionado = (id: number, tipo: 'Cliente' | 'Proveedor') => {
    const idCompleto = tipo === 'Cliente' ? id : id + 1000;
    setOrigenesSeleccionados(prev => 
      prev.includes(idCompleto)
        ? prev.filter(i => i !== idCompleto)
        : [...prev, idCompleto]
    );
  };

  const handleConfirmarImportacion = () => {
    const nuevosOrigenes: MapeoOrigen[] = [];

    // Agregar clientes seleccionados
    clientesDisponibles.forEach(cliente => {
      if (origenesSeleccionados.includes(cliente.id)) {
        // Verificar que no esté ya en la lista
        if (!mapeosOrigenes.some(o => o.cliente_id === cliente.id)) {
          nuevosOrigenes.push({
            id: cliente.id,
            codigo: '',
            nombre: cliente.empresa,
            tipo: 'Cliente',
            cliente_id: cliente.id,
            proveedor_id: null,
            asignado: false
          });
        }
      }
    });

    // Agregar proveedores seleccionados
    proveedoresDisponibles.forEach(proveedor => {
      const idCompleto = proveedor.id + 1000;
      if (origenesSeleccionados.includes(idCompleto)) {
        // Verificar que no esté ya en la lista
        if (!mapeosOrigenes.some(o => o.proveedor_id === proveedor.id)) {
          nuevosOrigenes.push({
            id: idCompleto,
            codigo: '',
            nombre: proveedor.empresa,
            tipo: 'Proveedor',
            cliente_id: null,
            proveedor_id: proveedor.id,
            asignado: false
          });
        }
      }
    });

    if (nuevosOrigenes.length > 0) {
      setMapeosOrigenes(prev => [...prev, ...nuevosOrigenes]);
      toast.success(`${nuevosOrigenes.length} origen(es) agregado(s) correctamente`);
    } else {
      toast.info('No se seleccionaron orígenes nuevos o ya están en la lista');
    }

    setIsImportarOrigenesDialogOpen(false);
    setOrigenesSeleccionados([]);
  };

  const filteredOrigenes = mapeosOrigenes.filter(o =>
    o.nombre.toLowerCase().includes(searchOrigenes.toLowerCase()) ||
    o.codigo.includes(searchOrigenes)
  );

  const filteredProductos = mapeosProductos.filter(p =>
    p.nombre.toLowerCase().includes(searchProductos.toLowerCase()) ||
    p.codigo.includes(searchProductos)
  );

  const filteredAlmacenes = mapeosAlmacenes.filter(a =>
    a.nombre.toLowerCase().includes(searchAlmacenes.toLowerCase()) ||
    a.codigo.includes(searchAlmacenes)
  );

  return (
    <Layout>
      <Header title="Control de Calidad" subtitle="Configuración de Sistema de Lotificación" />
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Códigos de Lotificación
            </CardTitle>
            <CardDescription>
              Asigne códigos a cada variable del sistema de lotificación. Una vez asignado, el código no se puede modificar.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="tipos-operacion" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tipos-operacion">Tipos de Operación</TabsTrigger>
            <TabsTrigger value="origenes">Orígenes (Empresas)</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="almacenes">Almacenes</TabsTrigger>
          </TabsList>

          {/* Tab Tipos de Operación */}
          <TabsContent value="tipos-operacion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tipos de Operación
                </CardTitle>
                <CardDescription>
                  Códigos predefinidos para tipos de operación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiposOperacion.map(tipo => (
                      <TableRow key={tipo.id}>
                        <TableCell className="font-mono font-semibold">{tipo.codigo}</TableCell>
                        <TableCell>{tipo.nombre}</TableCell>
                        <TableCell>
                          <Badge variant={tipo.activo ? 'default' : 'secondary'}>
                            {tipo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Orígenes */}
          <TabsContent value="origenes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Orígenes (Clientes y Proveedores)
                    </CardTitle>
                    <CardDescription>
                      Importe clientes y proveedores desde sus módulos y asigne códigos para el sistema de lotificación
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleImportarOrigenes}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Importar Clientes/Proveedores
                    </Button>
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar origen..."
                        className="pl-10"
                        value={searchOrigenes}
                        onChange={(e) => setSearchOrigenes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrigenes.map(origen => (
                      <TableRow key={origen.id}>
                        <TableCell>
                          {origen.asignado ? (
                            <Badge variant="outline" className="font-mono font-semibold">
                              {origen.codigo}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{origen.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{origen.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          {origen.asignado ? (
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600">Asignado</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {origen.asignado ? (
                            <Button variant="ghost" size="sm" disabled>
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAsignarCodigoOrigen(origen)}
                            >
                              Asignar Código
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Productos */}
          <TabsContent value="productos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Productos
                    </CardTitle>
                    <CardDescription>
                      Asigne códigos a productos para el sistema de lotificación
                    </CardDescription>
                  </div>
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto..."
                      className="pl-10"
                      value={searchProductos}
                      onChange={(e) => setSearchProductos(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductos.map(producto => (
                      <TableRow key={producto.id}>
                        <TableCell>
                          {producto.asignado ? (
                            <Badge variant="outline" className="font-mono font-semibold">
                              {producto.codigo}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{producto.nombre}</TableCell>
                        <TableCell>
                          {producto.asignado ? (
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600">Asignado</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {producto.asignado ? (
                            <Button variant="ghost" size="sm" disabled>
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAsignarCodigoProducto(producto)}
                            >
                              Asignar Código
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Almacenes */}
          <TabsContent value="almacenes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Warehouse className="h-5 w-5" />
                      Almacenes
                    </CardTitle>
                    <CardDescription>
                      Asigne códigos a almacenes para el sistema de lotificación
                    </CardDescription>
                  </div>
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar almacén..."
                      className="pl-10"
                      value={searchAlmacenes}
                      onChange={(e) => setSearchAlmacenes(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlmacenes.map(almacen => (
                      <TableRow key={almacen.id}>
                        <TableCell>
                          {almacen.asignado ? (
                            <Badge variant="outline" className="font-mono font-semibold">
                              {almacen.codigo}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{almacen.nombre}</TableCell>
                        <TableCell>
                          {almacen.asignado ? (
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600">Asignado</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {almacen.asignado ? (
                            <Button variant="ghost" size="sm" disabled>
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAsignarCodigoAlmacen(almacen)}
                            >
                              Asignar Código
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para importar orígenes */}
        <Dialog open={isImportarOrigenesDialogOpen} onOpenChange={setIsImportarOrigenesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importar Clientes y Proveedores</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <p className="text-sm text-muted-foreground">
                Seleccione los clientes y proveedores que desea agregar al sistema de lotificación. 
                Solo los seleccionados aparecerán en la lista de orígenes.
              </p>

              {/* Clientes */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clientes Disponibles
                </h3>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Empresa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientesDisponibles.map(cliente => {
                        const yaAgregado = mapeosOrigenes.some(o => o.cliente_id === cliente.id);
                        return (
                          <TableRow key={cliente.id} className={yaAgregado ? 'opacity-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={origenesSeleccionados.includes(cliente.id)}
                                onCheckedChange={() => handleToggleOrigenSeleccionado(cliente.id, 'Cliente')}
                                disabled={yaAgregado}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{cliente.empresa}</span>
                                {yaAgregado && (
                                  <Badge variant="outline" className="text-xs">Ya agregado</Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Proveedores */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Proveedores Disponibles
                </h3>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Empresa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proveedoresDisponibles.map(proveedor => {
                        const yaAgregado = mapeosOrigenes.some(o => o.proveedor_id === proveedor.id);
                        return (
                          <TableRow key={proveedor.id} className={yaAgregado ? 'opacity-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={origenesSeleccionados.includes(proveedor.id + 1000)}
                                onCheckedChange={() => handleToggleOrigenSeleccionado(proveedor.id, 'Proveedor')}
                                disabled={yaAgregado}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{proveedor.empresa}</span>
                                {yaAgregado && (
                                  <Badge variant="outline" className="text-xs">Ya agregado</Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsImportarOrigenesDialogOpen(false);
                setOrigenesSeleccionados([]);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmarImportacion}>
                Importar Seleccionados ({origenesSeleccionados.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para asignar código */}
        <Dialog open={!!editingOrigen || !!editingProducto || !!editingAlmacen} onOpenChange={() => {
          setEditingOrigen(null);
          setEditingProducto(null);
          setEditingAlmacen(null);
          setCodigoInput('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Asignar Código {editingOrigen ? 'de Origen' : editingProducto ? 'de Producto' : 'de Almacén'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>
                  {editingOrigen ? editingOrigen.nombre : editingProducto ? editingProducto.nombre : editingAlmacen?.nombre}
                </Label>
                <Input
                  placeholder="Ingrese código (ej: 17, 05, etc.)"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  maxLength={2}
                  className="mt-2 font-mono"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  El código debe ser de 2 dígitos. Una vez asignado, no se podrá modificar.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingOrigen(null);
                setEditingProducto(null);
                setEditingAlmacen(null);
                setCodigoInput('');
              }}>
                Cancelar
              </Button>
              <Button onClick={async () => {
                if (editingOrigen) handleGuardarCodigoOrigen();
                else if (editingProducto) await handleGuardarCodigoProducto();
                else if (editingAlmacen) await handleGuardarCodigoAlmacen();
              }}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ControlCalidad;
