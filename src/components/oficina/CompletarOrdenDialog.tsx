import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Ship } from 'lucide-react';
import { toast } from 'sonner';
import { useProductos } from '@/services/hooks/useProductos';
import { useProveedores } from '@/services/hooks/useProveedores';
import { useClientes } from '@/services/hooks/useClientes';
import { generateNumeroBoleta, TipoOperacion } from '@/utils/folioGenerator';
import type { Orden } from '@/services/supabase/ordenes';

interface CompletarOrdenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden: Orden | null;
  onSave: (ordenId: number, data: {
    producto_id: number;
    cliente_id?: number | null;
    proveedor_id?: number | null;
    tipo_transporte?: string;
  }) => Promise<void>;
}

const CompletarOrdenDialog: React.FC<CompletarOrdenDialogProps> = ({
  open,
  onOpenChange,
  orden,
  onSave
}) => {
  const { productos } = useProductos();
  const { proveedores } = useProveedores();
  const { clientes } = useClientes();

  const [productoId, setProductoId] = useState<string>('');
  const [clienteId, setClienteId] = useState<string>('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [tipoTransporte, setTipoTransporte] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Cargar datos de la orden cuando se abre el diálogo
  useEffect(() => {
    if (orden && open) {
      setProductoId(orden.producto_id?.toString() || '');
      setClienteId(orden.cliente_id?.toString() || '');
      setProveedorId(orden.proveedor_id?.toString() || '');
      // Obtener tipo_transporte de la orden si existe
      setTipoTransporte(orden.tipo_transporte || '');
    }
  }, [orden, open]);

  const handleSave = async () => {
    if (!orden) return;

    // Validaciones según el tipo de operación
    if (orden.tipo_operacion === 'Reciba') {
      if (!productoId || !proveedorId) {
        toast.error('Producto y Proveedor son requeridos para Reciba');
        return;
      }
    } else {
      if (!productoId || !clienteId) {
        toast.error('Producto y Cliente son requeridos para Embarque');
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(orden.id, {
        producto_id: parseInt(productoId),
        cliente_id: orden.tipo_operacion === 'Reciba' ? null : (clienteId ? parseInt(clienteId) : null),
        proveedor_id: orden.tipo_operacion === 'Reciba' ? (proveedorId ? parseInt(proveedorId) : null) : null,
        tipo_transporte: tipoTransporte || null
      });
      toast.success('Orden completada correctamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving orden:', error);
      toast.error('Error al guardar la orden');
    } finally {
      setLoading(false);
    }
  };

  if (!orden) return null;

  const isReciba = orden.tipo_operacion === 'Reciba';
  const isEmbarqueNacional = orden.tipo_operacion === 'Embarque Nacional';
  const isEmbarqueExportacion = orden.tipo_operacion === 'Embarque Exportación';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {orden.boleta.startsWith('TEMP-') ? 'Completar Boleta' : 'Editar Boleta'} - {orden.tipo_operacion}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del Ingreso (solo lectura) */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3 text-sm text-gray-600">Datos del Ingreso (Portero)</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Chofer</Label>
                <p className="font-medium">{orden.nombre_chofer || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Vehículo</Label>
                <p className="font-medium">{orden.vehiculo || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Placas</Label>
                <p className="font-medium font-mono">{orden.placas || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">{isReciba ? 'Origen' : 'Destino'}</Label>
                <p className="font-medium">{orden.destino || '-'}</p>
              </div>
            </div>
          </div>

          {/* Campos a completar */}
          <div className="space-y-4">
            {isReciba && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proveedor *</Label>
                    <Select value={proveedorId} onValueChange={setProveedorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map((prov) => (
                          <SelectItem key={prov.id} value={prov.id.toString()}>
                            {prov.empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Producto *</Label>
                    <Select value={productoId} onValueChange={setProductoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id.toString()}>
                            {prod.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Transporte</Label>
                  <Select value={tipoTransporte} onValueChange={setTipoTransporte}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Camión">Camión</SelectItem>
                      <SelectItem value="Ferroviaria">Ferroviaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(isEmbarqueNacional || isEmbarqueExportacion) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cli) => (
                          <SelectItem key={cli.id} value={cli.id.toString()}>
                            {cli.empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Producto *</Label>
                    <Select value={productoId} onValueChange={setProductoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id.toString()}>
                            {prod.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Transporte</Label>
                  <Select value={tipoTransporte} onValueChange={setTipoTransporte}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Camión">Camión</SelectItem>
                      <SelectItem value="Ferroviaria">Ferroviaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            className="bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? 'Guardando...' : orden.boleta.startsWith('TEMP-') ? 'Guardar y Generar Boleta' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletarOrdenDialog;

