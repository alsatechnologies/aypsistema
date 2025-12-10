
import React from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download } from 'lucide-react';

const Inventario = () => {
  // Mock data for inventory
  const inventoryItems = Array.from({ length: 15 }, (_, i) => ({
    id: `SK-${1000 + i}`,
    ubicacion: `Bodega ${Math.floor(Math.random() * 5) + 1}`,
    proveedor: ['Agrícola primavera sa de cv', 'Semillas del Pacífico sa de cv', 'Juan López Pérez'][Math.floor(Math.random() * 3)],
    fecha: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/04/2023`,
    estatus: ['Disponible', 'Ocupado', 'Reservado'][Math.floor(Math.random() * 3)],
  }));

  return (
    <Layout>
      <Header title="Inventario" />
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-medium">Movimientos de inventario</h2>
          <div className="flex gap-2">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID (SKU)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Columna Demo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Columna Demo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Columna Demo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.ubicacion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.proveedor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      item.estatus === 'Disponible' 
                        ? 'bg-green-100 text-green-800' 
                        : item.estatus === 'Ocupado' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Columna Demo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Columna Demo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Columna Demo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">Página 1 de 25</div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">Anterior</button>
            <button className="px-3 py-1 border rounded text-sm bg-gray-50 text-gray-700">1</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">...</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">10</button>
            <button className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inventario;
