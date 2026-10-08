import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useProductos } from '@/services/hooks/useProductos';
import { createMovimiento, getMovimientos } from '@/services/supabase/movimientos';

const PaseProduccionPanel: React.FC = () => {
  const { productos: productosDB } = useProductos();

  const [ppProductoId, setPpProductoId] = useState<string>('');
  const [ppCantidad, setPpCantidad] = useState<string>('');
  const [ppDestino, setPpDestino] = useState<string>('');
  const [ppGuardando, setPpGuardando] = useState(false);
  const [ppHistorial, setPpHistorial] = useState<any[]>([]);
  const [ppLoadingHistorial, setPpLoadingHistorial] = useState(false);

  const productosSemilla = productosDB.filter(p =>
    p.nombre.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes('SEMILLA')
  );

  const cargarHistorialPP = async () => {
    setPpLoadingHistorial(true);
    try {
      const data = await getMovimientos({ tipo: 'Producción', limit: 50 }) as any;
      setPpHistorial(Array.isArray(data) ? data : data.data || []);
    } catch { /* silencioso */ }
    finally { setPpLoadingHistorial(false); }
  };

  useEffect(() => { cargarHistorialPP(); }, []);

  const handlePaseProduccion = async () => {
    if (!ppProductoId) { toast.error('Seleccione un producto'); return; }
    const kg = parseFloat(ppCantidad);
    if (!kg || kg <= 0) { toast.error('Ingrese una cantidad válida'); return; }
    if (!ppDestino.trim()) { toast.error('Ingrese el destino'); return; }

    setPpGuardando(true);
    try {
      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`;
      const boleta = `PP-${fecha.replace(/-/g,'')}-${Date.now().toString().slice(-6)}`;

      await createMovimiento({
        boleta,
        producto_id: parseInt(ppProductoId),
        cliente_proveedor: ppDestino.trim(),
        tipo: 'Producción',
        transporte: null,
        fecha,
        ubicacion: ppDestino.trim(),
        peso_neto: kg,
        peso_bruto: kg,
        peso_tara: null,
        chofer: null,
        placas: null,
      });

      toast.success(`Pase registrado — ${kg.toLocaleString('es-MX')} kg → ${ppDestino}`);
      setPpProductoId('');
      setPpCantidad('');
      setPpDestino('');
      await cargarHistorialPP();
    } catch (err) {
      toast.error('Error al registrar el pase');
    } finally {
      setPpGuardando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Registrar Pase de Semilla a Producción
          </CardTitle>
          <CardDescription>
            La cantidad registrada se descontará del inventario de semilla.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Producto (Semilla) *</Label>
            <Select value={ppProductoId} onValueChange={setPpProductoId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar semilla..." />
              </SelectTrigger>
              <SelectContent>
                {productosSemilla.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cantidad (kg) *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={ppCantidad}
                onChange={e => setPpCantidad(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Destino *</Label>
              <Input
                placeholder="Ej: Extracción Planta 1"
                value={ppDestino}
                onChange={e => setPpDestino(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handlePaseProduccion}
            disabled={ppGuardando}
          >
            {ppGuardando ? 'Registrando...' : 'Registrar Pase'}
          </Button>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Pases</CardTitle>
        </CardHeader>
        <CardContent>
          {ppLoadingHistorial ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : ppHistorial.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin registros aún</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boleta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad (kg)</TableHead>
                  <TableHead>Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ppHistorial.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm text-primary">{m.boleta}</TableCell>
                    <TableCell>{m.fecha}</TableCell>
                    <TableCell>{m.producto?.nombre || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-orange-600">
                      -{(m.peso_neto || 0).toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell>{m.ubicacion || m.cliente_proveedor || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaseProduccionPanel;
