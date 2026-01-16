import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Download, Users, MapPin, Phone, Mail, Building2, Edit, Eye, Ship, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useClientes } from '@/services/hooks/useClientes';
import { useProductos } from '@/services/hooks/useProductos';
import type { Cliente as ClienteDB } from '@/services/supabase/clientes';

interface Cliente {
  id: number;
  empresa: string;
  rfc?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  tipoCliente: 'Nacional' | 'Exportación';
  productos: number[]; // IDs de productos
}

const Clientes = () => {
  const { clientes: clientesDB, loading, loadingMore, hasMore, addCliente, updateCliente, loadClientes, loadMore } = useClientes();
  const { productos: productosDB } = useProductos();
  
  const [search, setSearch] = useState('');
  const [isNuevoDialogOpen, setIsNuevoDialogOpen] = useState(false);
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  const [formData, setFormData] = useState({
    empresa: '',
    rfc: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    tipoCliente: 'Nacional' as 'Nacional' | 'Exportación',
    productos: [] as number[]
  });

  // Mapear clientes de DB a formato local
  const clientes: Cliente[] = clientesDB.map(c => ({
    id: c.id,
    empresa: c.empresa,
    rfc: c.rfc,
    contacto: c.contacto || '',
    telefono: c.telefono || '',
    email: c.email || '',
    direccion: c.direccion || '',
    ciudad: c.ciudad || '',
    tipoCliente: c.tipo_cliente as 'Nacional' | 'Exportación',
    productos: c.productos || []
  }));

  const filteredClientes = clientes.filter(c =>
    c.empresa.toLowerCase().includes(search.toLowerCase()) ||
    c.contacto.toLowerCase().includes(search.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ 
      empresa: '', 
      rfc: '', 
      contacto: '', 
      telefono: '', 
      email: '', 
      direccion: '', 
      ciudad: '', 
      tipoCliente: 'Nacional',
      productos: [] as number[]
    });
    setIsEditMode(false);
    setSelectedCliente(null);
  };

  const handleNuevoCliente = async () => {
    if (!formData.empresa) {
      toast.error('El nombre de la empresa es obligatorio');
      return;
    }

    try {
      if (isEditMode && selectedCliente) {
        // Modo edición
        await updateCliente(selectedCliente.id, {
          empresa: formData.empresa,
          rfc: formData.rfc && formData.rfc.trim() !== '' ? formData.rfc.toUpperCase() : null,
          contacto: formData.contacto && formData.contacto.trim() !== '' ? formData.contacto : null,
          telefono: formData.telefono && formData.telefono.trim() !== '' ? formData.telefono : null,
          email: formData.email && formData.email.trim() !== '' ? formData.email : null,
          direccion: formData.direccion && formData.direccion.trim() !== '' ? formData.direccion : null,
          ciudad: formData.ciudad && formData.ciudad.trim() !== '' ? formData.ciudad : null,
          tipo_cliente: formData.tipoCliente
        }, formData.productos);
        await loadClientes();
        toast.success('Cliente actualizado correctamente');
        setIsDetalleDialogOpen(false);
      } else {
        // Modo nuevo
        await addCliente({
          empresa: formData.empresa,
          rfc: formData.rfc && formData.rfc.trim() !== '' ? formData.rfc.toUpperCase() : null,
          contacto: formData.contacto && formData.contacto.trim() !== '' ? formData.contacto : null,
          telefono: formData.telefono && formData.telefono.trim() !== '' ? formData.telefono : null,
          email: formData.email && formData.email.trim() !== '' ? formData.email : null,
          direccion: formData.direccion && formData.direccion.trim() !== '' ? formData.direccion : null,
          ciudad: formData.ciudad && formData.ciudad.trim() !== '' ? formData.ciudad : null,
          tipo_cliente: formData.tipoCliente
        }, formData.productos);
        await loadClientes();
        toast.success('Cliente agregado correctamente');
        setIsNuevoDialogOpen(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast.error('Error al guardar cliente');
    }
  };

  const handleEditar = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      empresa: cliente.empresa,
      rfc: cliente.rfc,
      contacto: cliente.contacto || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      tipoCliente: cliente.tipoCliente,
      productos: [...cliente.productos]
    });
    setIsEditMode(true);
    setIsDetalleDialogOpen(false);
    setIsNuevoDialogOpen(true);
  };

  const handleToggleProducto = (productoId: number) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.includes(productoId)
        ? prev.productos.filter(p => p !== productoId)
        : [...prev.productos, productoId]
    }));
  };

  const handleVerDetalle = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsDetalleDialogOpen(true);
  };

  const handleDownload = () => {
    const headers = ['Empresa', 'RFC', 'Contacto', 'Teléfono', 'Email', 'Ciudad', 'Tipo'];
    const rows = filteredClientes.map(c => [
      c.empresa, c.rfc, c.contacto, c.telefono, c.email, c.ciudad, c.tipoCliente
    ]);

    // Usar TABULACIONES (\t) para compatibilidad universal con Excel (Windows y Mac)
    // Usar CRLF (\r\n) para compatibilidad con Windows Excel
    const csvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\r\n');

    // BOM (\uFEFF) para que Excel detecte UTF-8 correctamente en Windows
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Archivo descargado');
  };

  return (
    <Layout>
      <Header title="Clientes" subtitle="Gestión de clientes nacionales y de exportación" />
      <div className="p-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por empresa, contacto o ciudad..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => {
              resetForm();
              setIsNuevoDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>Clientes de producto terminado registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{cliente.empresa}</TableCell>
                    <TableCell className="font-mono text-sm">{cliente.rfc}</TableCell>
                    <TableCell>{cliente.contacto}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {cliente.telefono}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {cliente.ciudad}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cliente.tipoCliente === 'Nacional' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                        {cliente.tipoCliente}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(cliente)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="flex justify-center mt-4 pb-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nuevo Cliente Dialog */}
        <Dialog open={isNuevoDialogOpen} onOpenChange={(open) => {
          setIsNuevoDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Empresa *</Label>
                  <Input 
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input 
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="ABC123456XYZ"
                    maxLength={13}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Cliente *</Label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={formData.tipoCliente === 'Nacional'}
                        onChange={() => setFormData({ ...formData, tipoCliente: 'Nacional' })}
                        className="accent-primary"
                      />
                      Nacional
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={formData.tipoCliente === 'Exportación'}
                        onChange={() => setFormData({ ...formData, tipoCliente: 'Exportación' })}
                        className="accent-primary"
                      />
                      Exportación
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contacto</Label>
                  <Input 
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    placeholder="Nombre del contacto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="000-000-0000"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Dirección</Label>
                  <Input 
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, número, colonia"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Ciudad</Label>
                  <Input 
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Ciudad, Estado"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Productos</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {productosDB.map((producto) => (
                      <div key={producto.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`producto-${producto.id}`}
                          checked={formData.productos.includes(producto.id)}
                          onCheckedChange={() => handleToggleProducto(producto.id)}
                        />
                        <label
                          htmlFor={`producto-${producto.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {producto.nombre}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.productos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.productos.map((prodId) => {
                        const producto = productosDB.find(p => p.id === prodId);
                        return producto ? (
                          <Badge key={prodId} variant="outline" className="flex items-center gap-1">
                            {producto.nombre}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleToggleProducto(prodId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevoCliente}>
                {isEditMode ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cliente
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalle Cliente Dialog */}
        <Dialog open={isDetalleDialogOpen} onOpenChange={setIsDetalleDialogOpen}>
          <DialogContent className="max-w-lg">
            {selectedCliente && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {selectedCliente.empresa}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">RFC</Label>
                      <p className="font-mono">{selectedCliente.rfc}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Badge className={selectedCliente.tipoCliente === 'Nacional' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                        {selectedCliente.tipoCliente}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Contacto</Label>
                      <p>{selectedCliente.contacto}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Teléfono</Label>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedCliente.telefono}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedCliente.email}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Dirección</Label>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedCliente.direccion}, {selectedCliente.ciudad}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Productos</Label>
                      <div className="flex gap-1 flex-wrap">
                        {selectedCliente.productos.map((prodId) => {
                          const producto = productosDB.find(p => p.id === prodId);
                          return producto ? (
                            <Badge key={prodId} variant="outline">{producto.nombre}</Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DialogClose>
                  <Button variant="outline" onClick={() => handleEditar(selectedCliente)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Clientes;