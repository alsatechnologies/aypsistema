import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Plus } from 'lucide-react';

const Salidas = () => {
  const navigate = useNavigate();
  
  const salidas = [
    { id: '00132', producto: 'Semilla de maíz blanco', cliente: 'Juan López Pérez', fecha: '07/04/2023 03:35 p.m.', estatus: 'Activo' },
    { id: '00131', producto: 'Semilla de cártamo', cliente: 'Comercializadora El Sol sa de cv', fecha: '07/04/2023 02:14 p.m.', estatus: 'Activo' },
    { id: '00130', producto: 'Semilla de soya', cliente: 'Comercializadora El Sol sa de cv', fecha: '07/04/2023 02:00 p.m.', estatus: 'Activo' },
    { id: '00129', producto: 'Semilla de garbanzo', cliente: 'Comercializadora El Sol sa de cv', fecha: '07/04/2023 01:45 p.m.', estatus: 'Closed' },
    { id: '00128', producto: 'Semilla de sorgo', cliente: 'Comercializadora El Sol sa de cv', fecha: '07/04/2023 01:28 p.m.', estatus: 'Closed' },
    { id: '00127', producto: 'Semilla de soya', cliente: 'María García López', fecha: '07/04/2023 11:55 a.m.', estatus: 'Closed' },
    { id: '00126', producto: 'Semilla de garbanzo', cliente: 'María García López', fecha: '07/04/2023 11:35 a.m.', estatus: 'Closed' },
    { id: '00125', producto: 'Semilla de maíz amarillo', cliente: 'María García López', fecha: '07/04/2023 10:58 a.m.', estatus: 'Closed' },
    { id: '00121', producto: 'Semilla de sorgo', cliente: 'Distribuidora Norte sa de cv', fecha: '06/04/2023 09:33 p.m.', estatus: 'Closed' },
    { id: '00120', producto: 'Semilla de garbanzo', cliente: 'Distribuidora Norte sa de cv', fecha: '06/04/2023 09:17 p.m.', estatus: 'Closed' },
    { id: '00119', producto: 'Semilla de maíz blanco', cliente: 'Distribuidora Norte sa de cv', fecha: '06/04/2023 09:05 p.m.', estatus: 'Closed' },
  ];

  const handleAddNew = () => {
    navigate('/salidas/nuevo');
  };

  return (
    <Layout>
      <Header title="Salidas" />
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-medium">Historial de salidas</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={handleAddNew}
            >
              <Plus size={16} />
              Añadir Nueva
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boleta</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salidas.map((salida) => (
                <tr key={salida.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salida.producto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salida.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salida.cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salida.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`px-2 py-1 rounded-full ${salida.estatus === 'Activo' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {salida.estatus}
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

export default Salidas;
