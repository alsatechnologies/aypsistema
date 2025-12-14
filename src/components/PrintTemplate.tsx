
import React from 'react';
import { format } from 'date-fns';

interface PrintTemplateProps {
  data: {
    producto: string;
    cliente: string;
    conductor: string;
    placas: string;
    tipoVehiculo: string;
    pesoBruto: number;
    tara: number;
    pesoNeto: number;
    boleta: string;
    destino: string;
    ordenEntrega: string;
    observaciones: string;
  };
  currentDate: Date;
}

const PrintTemplate: React.FC<PrintTemplateProps> = ({ data, currentDate }) => {
  const formattedDate = format(currentDate, "dd/MM/yyyy HH:mm a");
  const formattedDateTime = format(currentDate, "HH:mm:ss a dd/MM/yyyy");

  return (
    <div className="print-template bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="header text-center mb-8 border-b-2 border-gray-300 pb-4">
        <h1 className="text-2xl font-bold mb-2">COMPROBANTE DE SALIDA</h1>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="text-sm">Fecha: {formattedDate}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Boleta: {data.boleta}</p>
          </div>
        </div>
      </div>

      <div className="content grid grid-cols-2 gap-8 mb-8">
        <div className="left-section">
          <div className="section mb-6">
            <h3 className="font-bold text-lg mb-3 border-b border-gray-200 pb-1">INFORMACIÓN DEL PRODUCTO</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-semibold w-20">Producto:</span>
                <span>{data.producto}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-20">Cliente:</span>
                <span>{data.cliente}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-20">Destino:</span>
                <span>{data.destino}</span>
              </div>
            </div>
          </div>

          <div className="section mb-6">
            <h3 className="font-bold text-lg mb-3 border-b border-gray-200 pb-1">INFORMACIÓN DEL TRANSPORTE</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-semibold w-20">Conductor:</span>
                <span>{data.conductor}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-20">Placas:</span>
                <span>{data.placas}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-20">Vehículo:</span>
                <span className="capitalize">{data.tipoVehiculo}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="right-section">
          <div className="section mb-6">
            <h3 className="font-bold text-lg mb-3 border-b border-gray-200 pb-1">MEDICIÓN DE PESO</h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Peso Bruto:</span>
                  <div className="text-right">
                    <span className="font-bold text-lg">{data.pesoBruto} kg</span>
                    <div className="text-xs text-gray-500">{formattedDateTime}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tara:</span>
                  <div className="text-right">
                    <span className="font-bold text-lg">{data.tara} kg</span>
                    <div className="text-xs text-gray-500">{formattedDateTime}</div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Peso Neto:</span>
                    <span className="font-bold text-xl">{data.pesoNeto} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section mb-6">
            <h3 className="font-bold text-lg mb-3 border-b border-gray-200 pb-1">INFORMACIÓN ADICIONAL</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-semibold w-32">Orden de Entrega:</span>
                <span>{data.ordenEntrega}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {data.observaciones && (
        <div className="section mb-8">
          <h3 className="font-bold text-lg mb-3 border-b border-gray-200 pb-1">OBSERVACIONES</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p>{data.observaciones}</p>
          </div>
        </div>
      )}

      <div className="footer mt-12 border-t border-gray-300 pt-6">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="border-b border-gray-400 mb-2 pb-1 h-12"></div>
            <p className="text-sm font-semibold">OPERADOR</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-2 pb-1 h-12"></div>
            <p className="text-sm font-semibold">CONDUCTOR</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-2 pb-1 h-12"></div>
            <p className="text-sm font-semibold">SUPERVISOR</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate;
