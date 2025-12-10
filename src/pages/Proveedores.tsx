import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Download, Truck, MapPin, Phone, Mail, Building2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Proveedor {
  id: number;
  empresa: string;
  rfc: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  productos: string[];
  estatus: 'Activo' | 'Inactivo';
}

const Proveedores = () => {
  const [search, setSearch] = useState('');
  const [isNuevoDialogOpen, setIsNuevoDialogOpen] = useState(false);
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  
  const [formData, setFormData] = useState({
    empresa: '',
    rfc: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: ''
  });

  const [proveedores, setProveedores] = useState<Proveedor[]>([
    { id: 1, empresa: 'Oleaginosas del Bajío SA de CV', rfc: 'OBA950315XYZ', contacto: 'Juan Pérez Gómez', telefono: '462-123-4567', email: 'ventas@oleaginosas.com', direccion: 'Carr. Irapuato-Salamanca Km 12', ciudad: 'Irapuato, GTO', productos: ['Frijol Soya', 'Maíz'], estatus: 'Activo' },
    { id: 2, empresa: 'Granos del Norte SA de CV', rfc: 'GNO980520ABC', contacto: 'María García López', telefono: '844-234-5678', email: 'contacto@granosnorte.com', direccion: 'Blvd. Industrial 456', ciudad: 'Saltillo, COAH', productos: ['Sorgo', 'Maíz', 'Trigo'], estatus: 'Activo' },
    { id: 3, empresa: 'Agrícola del Centro SA de CV', rfc: 'ACE010715DEF', contacto: 'Carlos López Martínez', telefono: '449-345-6789', email: 'info@agricolacentro.com', direccion: 'Av. Convención 789', ciudad: 'Aguascalientes, AGS', productos: ['Canola', 'Girasol'], estatus: 'Activo' },
    { id: 4, empresa: 'Exportadora de Granos MX SA de CV', rfc: 'EGM150320GHI', contacto: 'Ana Martínez Ruiz', telefono: '33-456-7890', email: 'export@granosmx.com', direccion: 'Zona Industrial Sur 321', ciudad: 'Guadalajara, JAL', productos: ['Frijol Soya'], estatus: 'Inactivo' },
    { id: 5, empresa: 'Semillas y Granos del Pacífico', rfc: 'SGP180610JKL', contacto: 'Pedro Ramírez Soto', telefono: '667-567-8901', email: 'ventas@semipacifico.com', direccion: 'Carretera Internacional 654', ciudad: 'Culiacán, SIN', productos: ['Maíz', 'Sorgo', 'Frijol Soya'], estatus: 'Activo' },
  ]);

  const filteredProveedores = proveedores.filter(p =>
    p.empresa.toLowerCase().includes(search.toLowerCase()) ||
    p.contacto.toLowerCase().includes(search.toLowerCase()) ||
    p.ciudad.toLowerCase().includes(search.toLowerCase())
  );

  const handleNuevoProveedor = () => {
    if (!formData.empresa || !formData.rfc || !formData.contacto) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const nuevoProveedor: Proveedor = {
      id: proveedores.length + 1,
      empresa: formData.empresa,
      rfc: formData.rfc.toUpperCase(),
      contacto: formData.contacto,
      telefono: formData.telefono,
      email: formData.email,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      productos: [],
      estatus: 'Activo'
    };

    setProveedores([nuevoProveedor, ...proveedores]);
    setFormData({ empresa: '', rfc: '', contacto: '', telefono: '', email: '', direccion: '', ciudad: '' });
    setIsNuevoDialogOpen(false);
    toast.success('Proveedor agregado correctamente');
  };

  const handleVerDetalle = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetalleDialogOpen(true);
  };

  const handleDownload = () => {
    const headers = ['Empresa', 'RFC', 'Contacto', 'Teléfono', 'Email', 'Ciudad', 'Estatus'];
    const rows = filteredProveedores.map(p => [
      p.empresa, p.rfc, p.contacto, p.telefono, p.email, p.ciudad, p.estatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Proveedores</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{proveedores.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
              <Truck className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{proveedores.filter(p => p.estatus === 'Activo').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactivos</CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{proveedores.filter(p => p.estatus === 'Inactivo').length}</div>
            </CardContent>
          </Card>
        </div>

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
            <Button onClick={() => setIsNuevoDialogOpen(true)}>
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
                  <TableHead>Empresa</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{proveedor.empresa}</TableCell>
                    <TableCell className="font-mono text-sm">{proveedor.rfc}</TableCell>
                    <TableCell>{proveedor.contacto}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {proveedor.telefono}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {proveedor.ciudad}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {proveedor.productos.slice(0, 2).map((prod, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{prod}</Badge>
                        ))}
                        {proveedor.productos.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{proveedor.productos.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={proveedor.estatus === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                        {proveedor.estatus}
                      </Badge>
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
          </CardContent>
        </Card>

        {/* Nuevo Proveedor Dialog */}
        <Dialog open={isNuevoDialogOpen} onOpenChange={setIsNuevoDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nuevo Proveedor
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
                  <Label>RFC *</Label>
                  <Input 
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="ABC123456XYZ"
                    maxLength={13}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contacto *</Label>
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
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevoProveedor}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Proveedor
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
                      <Label className="text-xs text-muted-foreground">RFC</Label>
                      <p className="font-mono">{selectedProveedor.rfc}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Estatus</Label>
                      <Badge className={selectedProveedor.estatus === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                        {selectedProveedor.estatus}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Contacto</Label>
                      <p>{selectedProveedor.contacto}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Teléfono</Label>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedProveedor.telefono}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedProveedor.email}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Dirección</Label>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedProveedor.direccion}, {selectedProveedor.ciudad}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Productos</Label>
                      <div className="flex gap-1 flex-wrap">
                        {selectedProveedor.productos.map((prod, idx) => (
                          <Badge key={idx} variant="outline">{prod}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DialogClose>
                  <Button variant="outline">
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
