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
import { Search, Plus, Download, Users, MapPin, Phone, Mail, Building2, Edit, Eye, Ship } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: number;
  empresa: string;
  rfc: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  tipoCliente: 'Nacional' | 'Exportación';
  productos: string[];
}

const Clientes = () => {
  const [search, setSearch] = useState('');
  const [isNuevoDialogOpen, setIsNuevoDialogOpen] = useState(false);
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  const [formData, setFormData] = useState({
    empresa: '',
    rfc: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    tipoCliente: 'Nacional' as 'Nacional' | 'Exportación'
  });

  const [clientes, setClientes] = useState<Cliente[]>([
    { id: 1, empresa: 'Aceites del Pacífico SA de CV', rfc: 'APA950315XYZ', contacto: 'Roberto Méndez', telefono: '33-123-4567', email: 'ventas@aceitespacifico.com', direccion: 'Av. Vallarta 1234', ciudad: 'Guadalajara, JAL', tipoCliente: 'Nacional', productos: ['Aceite Crudo de Soya', 'Aceite Refinado'] },
    { id: 2, empresa: 'Alimentos Balanceados MX SA de CV', rfc: 'ABM980520ABC', contacto: 'Laura Sánchez', telefono: '81-234-5678', email: 'compras@alimentosmx.com', direccion: 'Blvd. Fundadores 456', ciudad: 'Monterrey, NL', tipoCliente: 'Nacional', productos: ['Pasta de Soya', 'Cascarilla de Soya'] },
    { id: 3, empresa: 'Export Foods Inc.', rfc: 'EFI010715DEF', contacto: 'John Smith', telefono: '+1-713-456-7890', email: 'purchasing@exportfoods.com', direccion: '1234 Industrial Blvd', ciudad: 'Houston, TX', tipoCliente: 'Exportación', productos: ['Aceite Crudo de Soya'] },
    { id: 4, empresa: 'Industrias Graseras SA de CV', rfc: 'IGR150320GHI', contacto: 'Fernando López', telefono: '55-567-8901', email: 'compras@graseras.com', direccion: 'Calz. de Tlalpan 789', ciudad: 'CDMX', tipoCliente: 'Nacional', productos: ['Aceite Crudo de Soya', 'Lecitina'] },
    { id: 5, empresa: 'Pacific Trading Corp', rfc: 'PTC180610JKL', contacto: 'Michael Johnson', telefono: '+1-310-678-9012', email: 'info@pacifictrading.com', direccion: '5678 Commerce St', ciudad: 'Los Angeles, CA', tipoCliente: 'Exportación', productos: ['Aceite Refinado'] },
    { id: 6, empresa: 'Forrajes del Norte SA de CV', rfc: 'FNO160815MNO', contacto: 'Patricia Ruiz', telefono: '614-789-0123', email: 'ventas@forrajesnorte.com', direccion: 'Carr. Panamericana Km 15', ciudad: 'Chihuahua, CHIH', tipoCliente: 'Nacional', productos: ['Pasta de Soya', 'Cascarilla de Soya'] },
  ]);

  const filteredClientes = clientes.filter(c =>
    c.empresa.toLowerCase().includes(search.toLowerCase()) ||
    c.contacto.toLowerCase().includes(search.toLowerCase()) ||
    c.ciudad.toLowerCase().includes(search.toLowerCase())
  );

  const handleNuevoCliente = () => {
    if (!formData.empresa || !formData.rfc || !formData.contacto) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const nuevoCliente: Cliente = {
      id: clientes.length + 1,
      empresa: formData.empresa,
      rfc: formData.rfc.toUpperCase(),
      contacto: formData.contacto,
      telefono: formData.telefono,
      email: formData.email,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      tipoCliente: formData.tipoCliente,
      productos: []
    };

    setClientes([nuevoCliente, ...clientes]);
    setFormData({ empresa: '', rfc: '', contacto: '', telefono: '', email: '', direccion: '', ciudad: '', tipoCliente: 'Nacional' });
    setIsNuevoDialogOpen(false);
    toast.success('Cliente agregado correctamente');
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

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clientes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nacionales</CardTitle>
              <Building2 className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{clientes.filter(c => c.tipoCliente === 'Nacional').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exportación</CardTitle>
              <Ship className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{clientes.filter(c => c.tipoCliente === 'Exportación').length}</div>
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
          </CardContent>
        </Card>

        {/* Nuevo Cliente Dialog */}
        <Dialog open={isNuevoDialogOpen} onOpenChange={setIsNuevoDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nuevo Cliente
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
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevoCliente}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cliente
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
                        {selectedCliente.productos.map((prod, idx) => (
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

export default Clientes;