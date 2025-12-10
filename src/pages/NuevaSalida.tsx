import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import PrintTemplate from '@/components/PrintTemplate';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrinterIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { usePrint } from '@/hooks/usePrint';

const NuevaSalida = () => {
  const [formData, setFormData] = useState({
    producto: 'Semilla de maíz blanco',
    cliente: '',
    conductor: '',
    placas: '',
    tipoVehiculo: 'camion',
    pesoBruto: 0,
    tara: 0,
    pesoNeto: 0,
    folio: '00133',
    destino: '',
    ordenEntrega: '',
    observaciones: ''
  });
  
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd/MM/yyyy HH:mm a");
  const { printRef, handlePrint } = usePrint();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      tipoVehiculo: e.target.value
    });
  };

  const calculateNet = () => {
    const bruto = parseFloat(formData.pesoBruto.toString());
    const tara = parseFloat(formData.tara.toString());
    const neto = bruto - tara;
    setFormData({
      ...formData,
      pesoNeto: neto
    });
  };

  return (
    <Layout>
      <Header title="Salidas" />
      <div className="p-6">
        {/* Hidden print template */}
        <div ref={printRef} className="hidden">
          <PrintTemplate data={formData} currentDate={currentDate} />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500">Fecha {formattedDate}</div>
          </div>
          <div className="text-sm text-gray-500">Folio: {formData.folio}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Producto</Label>
              <div className="flex">
                <select name="producto" value={formData.producto} onChange={handleSelectChange} className="border border-gray-300 p-2 rounded-md w-full">
                  <option value="Semilla de maíz blanco">Semilla de maíz blanco</option>
                  <option value="Semilla de cártamo">Semilla de cártamo</option>
                  <option value="Semilla de soya">Semilla de soya</option>
                  <option value="Semilla de garbanzo">Semilla de garbanzo</option>
                  <option value="Semilla de sorgo">Semilla de sorgo</option>
                  <option value="Semilla de maíz amarillo">Semilla de maíz amarillo</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label>Cliente</Label>
              <div className="flex">
                <select name="cliente" value={formData.cliente} onChange={handleSelectChange} className="border border-gray-300 p-2 rounded-md w-full">
                  <option value="">Seleccionar...</option>
                  <option value="Juan López Pérez">Juan López Pérez</option>
                  <option value="Comercializadora El Sol sa de cv">Comercializadora El Sol sa de cv</option>
                  <option value="María García López">María García López</option>
                  <option value="Distribuidora Norte sa de cv">Distribuidora Norte sa de cv</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label>Destino</Label>
              <Input
                name="destino"
                value={formData.destino}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label>Conductor</Label>
              <Input
                name="conductor"
                value={formData.conductor}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label>Placas</Label>
              <Input
                name="placas"
                value={formData.placas}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <Label className="block mb-2">Báscula</Label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="camion" 
                    name="tipoVehiculo" 
                    value="camion" 
                    checked={formData.tipoVehiculo === 'camion'} 
                    onChange={handleRadioChange}
                    className="mr-2" 
                  />
                  <Label htmlFor="camion">Camión</Label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="tolva" 
                    name="tipoVehiculo" 
                    value="tolva" 
                    checked={formData.tipoVehiculo === 'tolva'} 
                    onChange={handleRadioChange} 
                    className="mr-2" 
                  />
                  <Label htmlFor="tolva">Tolva</Label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="furgon" 
                    name="tipoVehiculo" 
                    value="furgon" 
                    checked={formData.tipoVehiculo === 'furgon'} 
                    onChange={handleRadioChange} 
                    className="mr-2" 
                  />
                  <Label htmlFor="furgon">Furgón</Label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Peso para salida</div>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <Label>Bruto</Label>
                  <div className="text-sm text-gray-500">{format(currentDate, "HH:mm:ss a dd/MM/yyyy")}</div>
                </div>
                <div className="flex">
                  <Input
                    name="pesoBruto"
                    value={formData.pesoBruto}
                    onChange={handleInputChange}
                    className="flex-grow bg-[#BAFFB0]"
                  />
                  <span className="ml-2 flex items-center text-sm">kg</span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <Label>Tara</Label>
                  <div className="text-sm text-gray-500">{format(currentDate, "HH:mm:ss a dd/MM/yyyy")}</div>
                </div>
                <div className="flex">
                  <Input
                    name="tara"
                    value={formData.tara}
                    onChange={handleInputChange}
                    className="flex-grow bg-pink-100"
                  />
                  <span className="ml-2 flex items-center text-sm">kg</span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <Label>Neto</Label>
                </div>
                <div className="flex">
                  <Input
                    name="pesoNeto"
                    value={formData.pesoNeto}
                    readOnly
                    className="flex-grow"
                  />
                  <span className="ml-2 flex items-center text-sm">kg</span>
                </div>
              </div>
              
              <div className="mt-2">
                <Button 
                  className="w-full bg-white text-black border border-gray-300 hover:bg-gray-100"
                  onClick={calculateNet}
                >
                  Leer Peso
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-medium mb-4">Información de Entrega</h3>
            <div className="space-y-4">
              <div>
                <Label>Orden de Entrega</Label>
                <Input
                  name="ordenEntrega"
                  value={formData.ordenEntrega}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Observaciones</h3>
            <div>
              <Label>Observaciones</Label>
              <textarea 
                name="observaciones" 
                value={formData.observaciones} 
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})} 
                className="border border-gray-300 p-2 rounded-md w-full h-32"
                placeholder="Ingrese observaciones sobre la salida..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handlePrint}
          >
            <PrinterIcon size={18} />
            Imprimir
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary-hover flex items-center gap-2">
            <Save size={18} />
            Guardar
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NuevaSalida;
