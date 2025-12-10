
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import Layout from '../components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileDown } from 'lucide-react';

interface Proveedor {
  id: string;
  empresa: string;
  nombre: string;
  fecha: string;
  telefono: string;
  email: string;
  ubicacion: string;
  columna: string;
}

const proveedoresIniciales: Proveedor[] = [
  { id: '001', empresa: 'Empresa A', nombre: 'Juan Pérez', fecha: '15/03/2023', telefono: '555-123-4567', email: 'juan@empresaa.com', ubicacion: 'Madrid', columna: 'Columna Demo' },
  { id: '002', empresa: 'Empresa B', nombre: 'Ana López', fecha: '20/04/2023', telefono: '555-234-5678', email: 'ana@empresab.com', ubicacion: 'Barcelona', columna: 'Columna Demo' },
  { id: '003', empresa: 'Empresa C', nombre: 'Carlos García', fecha: '10/05/2023', telefono: '555-345-6789', email: 'carlos@empresac.com', ubicacion: 'Valencia', columna: 'Columna Demo' },
  { id: '004', empresa: 'Empresa D', nombre: 'María Rodríguez', fecha: '05/06/2023', telefono: '555-456-7890', email: 'maria@empresad.com', ubicacion: 'Sevilla', columna: 'Columna Demo' },
  { id: '005', empresa: 'Empresa E', nombre: 'Pedro Martínez', fecha: '18/07/2023', telefono: '555-567-8901', email: 'pedro@empresae.com', ubicacion: 'Bilbao', columna: 'Columna Demo' },
  { id: '006', empresa: 'Empresa F', nombre: 'Laura Sánchez', fecha: '22/08/2023', telefono: '555-678-9012', email: 'laura@empresaf.com', ubicacion: 'Zaragoza', columna: 'Columna Demo' },
  { id: '007', empresa: 'Empresa G', nombre: 'Miguel Fernández', fecha: '14/09/2023', telefono: '555-789-0123', email: 'miguel@empresag.com', ubicacion: 'Málaga', columna: 'Columna Demo' },
  { id: '008', empresa: 'Empresa H', nombre: 'Sofía González', fecha: '30/10/2023', telefono: '555-890-1234', email: 'sofia@empresah.com', ubicacion: 'Murcia', columna: 'Columna Demo' },
  { id: '009', empresa: 'Empresa I', nombre: 'David Díaz', fecha: '08/11/2023', telefono: '555-901-2345', email: 'david@empresai.com', ubicacion: 'Alicante', columna: 'Columna Demo' },
  { id: '010', empresa: 'Empresa J', nombre: 'Elena Torres', fecha: '12/12/2023', telefono: '555-012-3456', email: 'elena@empresaj.com', ubicacion: 'Granada', columna: 'Columna Demo' },
];

const Proveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>(proveedoresIniciales);
  
  return (
    <Layout>
      <Header title="Proveedores" />
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <Link to="/proveedores/nuevo">
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" /> Añadir Nuevo
            </Button>
          </Link>
        </div>
        
        <div className="bg-white rounded-md shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Lista de proveedores</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de alta</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Columna Demo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell>{proveedor.id}</TableCell>
                    <TableCell>{proveedor.empresa}</TableCell>
                    <TableCell>{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.fecha}</TableCell>
                    <TableCell>{proveedor.telefono}</TableCell>
                    <TableCell>{proveedor.email}</TableCell>
                    <TableCell>{proveedor.ubicacion}</TableCell>
                    <TableCell>{proveedor.columna}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-2 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Página 1 de 10
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Anterior</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">3</Button>
              <span className="text-sm text-gray-500">...</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">10</Button>
              <span className="text-sm text-gray-500">Siguiente</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Proveedores;
