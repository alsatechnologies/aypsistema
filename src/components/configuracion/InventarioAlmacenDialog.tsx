import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useInventarioAlmacenes } from '@/services/hooks/useInventarioAlmacenes';
import { useProductos } from '@/services/hooks/useProductos';
import { toast } from 'sonner';

interface InventarioAlmacenDialogProps {
  almacenId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidad: string;
  onInventarioUpdated?: () => void;
}

const InventarioAlmacenDialog: React.FC<InventarioAlmacenDialogProps> = ({
  almacenId,
  open,
  onOpenChange,
  unidad,
  onInventarioUpdated
}) => {
  const { inventario, loading, agregarProducto, actualizarCantidad, eliminarProducto } = useInventarioAlmacenes(almacenId || undefined);
  const { productos: productosDB } = useProductos();
  const [nuevoProducto, setNuevoProducto] = useState({ productoId: '', cantidad: '' });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cantidadEditando, setCantidadEditando] = useState('');

  const productosDisponibles = productosDB.filter(p => 
    !inventario.some(i => i.producto_id === p.id && i.id !== editandoId)
  );

  const handleAgregarProducto = async () => {
    if (!nuevoProducto.productoId || !nuevoProducto.cantidad) {
      toast.error('Selecciona un producto e ingresa la cantidad');
      return;
    }

    const cantidad = Number(nuevoProducto.cantidad);
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await agregarProducto(Number(nuevoProducto.productoId), cantidad);
      setNuevoProducto({ productoId: '', cantidad: '' });
      onInventarioUpdated?.();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleEditarCantidad = (id: number, cantidadActual: number) => {
    setEditandoId(id);
    setCantidadEditando(cantidadActual.toString());
  };

  const handleGuardarEdicion = async (id: number) => {
    const cantidad = Number(cantidadEditando);
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await actualizarCantidad(id, cantidad);
      setEditandoId(null);
      setCantidadEditando('');
      onInventarioUpdated?.();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      try {
        await eliminarProducto(id);
        onInventarioUpdated?.();
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  };

  const totalInventario = inventario.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Inventario del Almacén</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Agregar nuevo producto */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold">Agregar Producto</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Select 
                  value={nuevoProducto.productoId} 
                  onValueChange={(value) => setNuevoProducto(prev => ({ ...prev, productoId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No hay productos disponibles</div>
                    ) : (
                      productosDisponibles.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id.toString()}>
                          {producto.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={nuevoProducto.cantidad}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, cantidad: e.target.value }))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-3">
                <Button 
                  onClick={handleAgregarProducto}
                  className="w-full"
                  disabled={!nuevoProducto.productoId || !nuevoProducto.cantidad}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de productos en inventario */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Productos en Inventario</Label>
                <span className="text-sm text-muted-foreground">
                  Total: {totalInventario.toLocaleString('es-MX')} {unidad}
                </span>
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : inventario.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No hay productos en el inventario
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad ({unidad})</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventario.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.producto?.nombre || `Producto #${item.producto_id}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {editandoId === item.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              value={cantidadEditando}
                              onChange={(e) => setCantidadEditando(e.target.value)}
                              className="w-24"
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleGuardarEdicion(item.id)}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditandoId(null);
                                setCantidadEditando('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span>{Number(item.cantidad).toLocaleString('es-MX')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editandoId === item.id ? null : (
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditarCantidad(item.id, Number(item.cantidad))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEliminar(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventarioAlmacenDialog;

