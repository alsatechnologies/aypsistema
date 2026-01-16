import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Download, Building2, MapPin, Phone, Mail, Eye, Edit, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useProveedores } from '@/services/hooks/useProveedores';
import type { Proveedor as ProveedorDB } from '@/services/supabase/proveedores';

interface Proveedor {
  id: number;
  empresa: string;
  producto?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaAlta: string;
  ubicacion?: string | null;
}

const Proveedores = () => {
  const { proveedores: proveedoresDB, loading, loadingMore, hasMore, addProveedor, updateProveedor, loadProveedores, loadMore } = useProveedores();
  
  const [search, setSearch] = useState('');
  const [isNuevoDialogOpen, setIsNuevoDialogOpen] = useState(false);
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProveedorId, setEditingProveedorId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    empresa: '',
    producto: '',
    telefono: '',
    email: '',
    ubicacion: ''
  });

  // Mapear proveedores de DB a formato local
  const proveedores: Proveedor[] = proveedoresDB.map(p => ({
    id: p.id,
    empresa: p.empresa,
    producto: p.producto || '',
    telefono: p.telefono || '',
    email: p.email || '',
    fechaAlta: p.fecha_alta || new Date().toISOString().split('T')[0],
    ubicacion: p.ubicacion || ''
  }));

  const filteredProveedores = proveedores.filter(p =>
    p.empresa.toLowerCase().includes(search.toLowerCase()) ||
    p.producto.toLowerCase().includes(search.toLowerCase()) ||
    p.ubicacion.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ empresa: '', producto: '', telefono: '', email: '', ubicacion: '' });
    setIsEditMode(false);
    setEditingProveedorId(null);
  };

  const handleNuevoProveedor = async () => {
    if (!formData.empresa) {
      toast.error('El campo Empresa es obligatorio');
      return;
    }

    try {
      if (isEditMode && editingProveedorId) {
        // Modo edición
        await updateProveedor(editingProveedorId, {
          empresa: formData.empresa,
          producto: formData.producto || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          ubicacion: formData.ubicacion || null
        });
        await loadProveedores();
        resetForm();
        setIsNuevoDialogOpen(false);
        toast.success('Proveedor actualizado correctamente');
      } else {
        // Modo creación
        await addProveedor({
          empresa: formData.empresa,
          producto: formData.producto || null,
          telefono: formData.telefono || null,
          email: formData.email || null,
          ubicacion: formData.ubicacion || null,
          fecha_alta: new Date().toISOString().split('T')[0]
        });
        await loadProveedores();
        resetForm();
        setIsNuevoDialogOpen(false);
        toast.success('Proveedor agregado correctamente');
      }
    } catch (error) {
      console.error('Error saving proveedor:', error);
      toast.error('Error al guardar proveedor');
    }
  };

  const handleEditar = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      empresa: proveedor.empresa,
      producto: proveedor.producto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      ubicacion: proveedor.ubicacion || ''
    });
    setIsEditMode(true);
    setEditingProveedorId(proveedor.id);
    setIsDetalleDialogOpen(false);
    setIsNuevoDialogOpen(true);
  };

  const handleVerDetalle = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetalleDialogOpen(true);
  };

  const handleDownload = () => {
    const headers = ['Empresa', 'Producto', 'Teléfono', 'Email', 'Fecha de Alta', 'Ubicación'];
    const rows = filteredProveedores.map(p => [
      p.empresa, p.producto, p.telefono, p.email, p.fechaAlta, p.ubicacion
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    // BOM (\uFEFF) para que Excel detecte UTF-8 correctamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Archivo descargado');
  };

  return (
    <Layout>
      <Header title="Proveedores" subtitle="Gestión de proveedores de materia prima" />
      <div className="p-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por empresa, producto o ubicación..." 
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
              Nuevo Proveedor
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Proveedores</CardTitle>
            <CardDescription>Proveedores de materia prima registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOMBRE EMPRESA</TableHead>
                  <TableHead>PRODUCTO</TableHead>
                  <TableHead>TELÉFONO</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>FECHA DE ALTA</TableHead>
                  <TableHead>UBICACIÓN</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{proveedor.empresa}</TableCell>
                    <TableCell>{proveedor.producto || '-'}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {proveedor.telefono || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {proveedor.email || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{proveedor.fechaAlta}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {proveedor.ubicacion || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(proveedor)}>
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

        {/* Nuevo/Editar Proveedor Dialog */}
        <Dialog open={isNuevoDialogOpen} onOpenChange={(open) => {
          setIsNuevoDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                <div className="space-y-2 col-span-2">
                  <Label>Producto</Label>
                  <Input 
                    value={formData.producto}
                    onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                    placeholder="Producto que suministra"
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
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Ubicación</Label>
                  <Input 
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Ciudad, Estado"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevoProveedor}>
                {isEditMode ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Proveedor
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalle Proveedor Dialog */}
        <Dialog open={isDetalleDialogOpen} onOpenChange={setIsDetalleDialogOpen}>
          <DialogContent className="max-w-lg">
            {selectedProveedor && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedProveedor.empresa}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Producto</Label>
                      <p className="font-medium">{selectedProveedor.producto || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fecha de Alta</Label>
                      <p>{selectedProveedor.fechaAlta}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Teléfono</Label>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedProveedor.telefono || '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedProveedor.email || '-'}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Ubicación</Label>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedProveedor.ubicacion || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DialogClose>
                  <Button variant="outline" onClick={() => handleEditar(selectedProveedor)}>
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

export default Proveedores;