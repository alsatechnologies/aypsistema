
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';

const NuevaOrden = () => {
  const [formData, setFormData] = useState({
    cliente: '',
    chofer: '',
    placas: '',
    procedencia: '',
    producto: '',
    cantidad: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <Layout>
      <Header title="Nueva Orden" />
      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Cliente</Label>
              <Input
                name="cliente"
                value={formData.cliente}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>

            <div>
              <Label>Chofer</Label>
              <Input
                name="chofer"
                value={formData.chofer}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>

            <div>
              <Label>Placas</Label>
              <Input
                name="placas"
                value={formData.placas}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>

            <div>
              <Label>Procedencia</Label>
              <Input
                name="procedencia"
                value={formData.procedencia}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>

            <div>
              <Label>Producto a llevar</Label>
              <Input
                name="producto"
                value={formData.producto}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>

            <div>
              <Label>Cantidad</Label>
              <div className="flex">
                <Input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  className="flex-grow"
                />
                <span className="ml-2 flex items-center text-sm">kg</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover flex items-center gap-2">
              <Save size={18} />
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NuevaOrden;
