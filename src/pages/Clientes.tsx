
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Plus } from 'lucide-react';

const Clientes = () => {
  const navigate = useNavigate();
  
  const clientes = [
    { id: 1, nombre: 'Juan López Pérez', telefono: '664-123-4567', email: 'juan.lopez@email.com', direccion: 'Av. Principal 123, Tijuana', estatus: 'Activo' },
    { id: 2, nombre: 'Comercializadora El Sol SA de CV', telefono: '664-987-6543', email: 'contacto@elsol.com', direccion: 'Blvd. Industrial 456, Tijuana', estatus: 'Activo' },
    { id: 3, nombre: 'María García López', telefono: '664-555-0123', email: 'maria.garcia@email.com', direccion: 'Calle Revolución 789, Tijuana', estatus: 'Activo' },
    { id: 4, nombre: 'Distribuidora Norte SA de CV', telefono: '664-111-2222', email: 'ventas@norte.com', direccion: 'Zona Industrial 321, Tijuana', estatus: 'Inactivo' },
    { id: 5, nombre: 'Pedro Ramírez Sánchez', telefono: '664-333-4444', email: 'pedro.ramirez@email.com', direccion: 'Col. Centro 654, Tijuana', estatus: 'Activo' },
    { id: 6, nombre: 'Agrícola Los Valles SA de CV', telefono: '664-777-8888', email: 'info@losvalles.com', direccion: 'Carretera Federal 987, Tijuana', estatus: 'Activo' },
  ];

  const handleAddNew = () => {
    navigate('/clientes/nuevo');
  };

  return (
    <Layout>
      <Header title="Clientes" />
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-medium">Lista de clientes</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={handleAddNew}
            >
              <Plus size={16} />
              Añadir Nuevo
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input className="pl-10 w-60" placeholder="Buscar" />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download size={18} />
              Descargar
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.direccion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`px-2 py-1 rounded-full ${cliente.estatus === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cliente.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">Página 1 de 10</div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">Anterior</button>
            <button className="px-3 py-1 border rounded text-sm bg-gray-50 text-gray-700">1</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Clientes;
