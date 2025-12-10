import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PrinterIcon, Save } from 'lucide-react';
import { format } from 'date-fns';

const NuevaRecepcion = () => {
  const [formData, setFormData] = useState({
    producto: 'Aceite de cártamo',
    productor: '',
    conductor: '',
    placas: '',
    tipoVehiculo: 'camion',
    pesoBruto: 0,
    tara: 0,
    pesoNeto: 0,
    humedad: 0,
    impureza: 0,
    aceite: 0,
    indicePodo: 0,
    grasaDañada: 0,
    granoQuebrado: 0,
    granoDañado: 0,
    cromatografia: 0,
    descuentoTotal: 0,
    descuentoKg: 0,
    pesoNetoLiquidar: 0,
    folio: '00146',
    procedencia: '',
    residencia: '',
    recibo: '',
    observaciones: ''
  });
  
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd/MM/yyyy HH:mm a");

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
      <Header title="Recepción" />
      <div className="p-6">
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
                  <option value="Aceite de cártamo">Aceite de cártamo</option>
                  <option value="Semilla de maíz">Semilla de maíz</option>
                  <option value="Semilla de soya">Semilla de soya</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label>Productor</Label>
              <div className="flex">
                <select name="productor" value={formData.productor} onChange={handleSelectChange} className="border border-gray-300 p-2 rounded-md w-full">
                  <option value="">Seleccionar...</option>
                  <option value="Juan López Pérez">Juan López Pérez</option>
                  <option value="César Ramos López">César Ramos López</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label>Procedencia</Label>
              <Input
                name="procedencia"
                value={formData.procedencia}
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
              <div className="text-sm font-medium mb-2">Peso sin analizar</div>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <Label>Bruto</Label>
                  <div className="text-sm text-gray-500">14:25:10 p.m. 03/04/2023</div>
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
                  <div className="text-sm text-gray-500">14:26:30 p.m. 03/04/2023</div>
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
            <h3 className="font-medium mb-4">Análisis</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Humedad</Label>
                <div className="flex">
                  <Input name="humedad" value={formData.humedad} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Impureza</Label>
                <div className="flex">
                  <Input name="impureza" value={formData.impureza} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Aceite</Label>
                <div className="flex">
                  <Input name="aceite" value={formData.aceite} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Índice de yodo</Label>
                <div className="flex">
                  <Input name="indicePodo" value={formData.indicePodo} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Grasa dañada</Label>
                <div className="flex">
                  <Input name="grasaDañada" value={formData.grasaDañada} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Grano quebrado</Label>
                <div className="flex">
                  <Input name="granoQuebrado" value={formData.granoQuebrado} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Grano dañado</Label>
                <div className="flex">
                  <Input name="granoDañado" value={formData.granoDañado} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
              
              <div>
                <Label>Cromatografía</Label>
                <div className="flex">
                  <Input name="cromatografia" value={formData.cromatografia} onChange={handleInputChange} />
                  <span className="ml-2 flex items-center text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="font-medium">Descuento / Bonificación Total</div>
              <div className="flex items-center mt-2">
                <Label className="mr-2">Descuento en kg</Label>
                <Input 
                  name="descuentoKg" 
                  value={formData.descuentoKg} 
                  onChange={handleInputChange} 
                  className="flex-grow"
                />
              </div>
              <div className="flex items-center mt-2">
                <Label className="mr-2">Peso neto a liquidar</Label>
                <Input 
                  name="pesoNetoLiquidar" 
                  value={formData.pesoNetoLiquidar} 
                  onChange={handleInputChange} 
                  className="flex-grow"
                />
                <span className="ml-2 text-sm">kg</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Descuento / Bonificación</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center font-medium">%</div>
              <div className="text-center font-medium">%</div>
              <div className="text-center font-medium">Aplicar</div>
              
              {[
                'Humedad',
                'Impureza',
                'Aceite',
                'Índice de yodo',
                'Grasa dañada',
                'Grano quebrado',
                'Grano dañado',
                'Cromatografía'
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <div className="text-center">0.0</div>
                  <div className="text-center">0.0</div>
                  <div className="text-center">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            <div className="mt-6">
              <div>
                <Label>Residencia</Label>
                <select name="residencia" value={formData.residencia} onChange={handleSelectChange} className="border border-gray-300 p-2 rounded-md w-full">
                  <option value="">Seleccionar...</option>
                  <option value="Residencia 1">Residencia 1</option>
                  <option value="Residencia 2">Residencia 2</option>
                </select>
              </div>
              
              <div className="mt-3">
                <Label>Recibo</Label>
                <select name="recibo" value={formData.recibo} onChange={handleSelectChange} className="border border-gray-300 p-2 rounded-md w-full">
                  <option value="">Seleccionar...</option>
                  <option value="Recibo 1">Recibo 1</option>
                  <option value="Recibo 2">Recibo 2</option>
                </select>
              </div>
              
              <div className="mt-3">
                <Label>Observaciones</Label>
                <textarea 
                  name="observaciones" 
                  value={formData.observaciones} 
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})} 
                  className="border border-gray-300 p-2 rounded-md w-full h-20"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" className="flex items-center gap-2">
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

export default NuevaRecepcion;
