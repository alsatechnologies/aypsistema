import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { History, Plus, Edit, Trash2, User, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTimeMST } from '@/utils/dateUtils';

interface AuditoriaEntry {
  id: number;
  tabla: string;
  registro_id: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'DELETE_PERMANENT';
  datos_anteriores: Record<string, any> | null;
  datos_nuevos: Record<string, any> | null;
  usuario_id: number | null;
  usuario_email: string | null;
  fecha_hora: string;
}

interface HistorialCambiosButtonProps {
  tabla: 'embarques' | 'recepciones' | 'ordenes' | 'movimientos' | 'clientes' | 'proveedores';
  registroId: number;
  boleta?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

const ACCIONES_AMIGABLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'INSERT': { label: 'Creación', color: 'bg-green-100 text-green-700 border-green-300', icon: <Plus className="h-3 w-3" /> },
  'UPDATE': { label: 'Modificación', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Edit className="h-3 w-3" /> },
  'DELETE': { label: 'Eliminación', color: 'bg-red-100 text-red-700 border-red-300', icon: <Trash2 className="h-3 w-3" /> },
  'DELETE_PERMANENT': { label: 'Eliminación Permanente', color: 'bg-red-200 text-red-800 border-red-400', icon: <Trash2 className="h-3 w-3" /> },
};

const TABLAS_AMIGABLES: Record<string, string> = {
  'embarques': 'Embarque',
  'recepciones': 'Reciba',
  'ordenes': 'Orden',
  'movimientos': 'Movimiento',
  'clientes': 'Cliente',
  'proveedores': 'Proveedor',
};

const HistorialCambiosButton: React.FC<HistorialCambiosButtonProps> = ({
  tabla,
  registroId,
  boleta,
  variant = 'ghost',
  size = 'sm'
}) => {
  const { esAdministrador } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [historial, setHistorial] = useState<AuditoriaEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditoriaEntry | null>(null);
  const [usuariosMap, setUsuariosMap] = useState<Map<string, string>>(new Map());

  // Solo mostrar para administradores
  if (!esAdministrador()) return null;

  const loadUsuarios = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('correo, nombre_completo');
      
      if (error) throw error;
      
      const map = new Map<string, string>();
      (data || []).forEach(u => {
        if (u.correo && u.nombre_completo) {
          map.set(u.correo, u.nombre_completo);
        }
      });
      setUsuariosMap(map);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadHistorial = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auditoria')
        .select('*')
        .eq('tabla', tabla)
        .eq('registro_id', registroId)
        .order('fecha_hora', { ascending: false });

      if (error) throw error;
      setHistorial(data || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadUsuarios();
    loadHistorial();
  };

  const getNombreUsuario = (email: string | null) => {
    if (!email) return 'Sistema';
    return usuariosMap.get(email) || email;
  };

  const getAccionBadge = (accion: string) => {
    const config = ACCIONES_AMIGABLES[accion] || { label: accion, color: 'bg-gray-100 text-gray-700', icon: null };
    return (
      <Badge className={`flex items-center gap-1 w-fit ${config.color}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const renderJsonDiff = (anterior: Record<string, any> | null, nuevo: Record<string, any> | null) => {
    const allKeys = new Set([
      ...Object.keys(anterior || {}),
      ...Object.keys(nuevo || {})
    ]);

    // Campos a excluir del diff
    const excludeKeys = ['created_at', 'updated_at', 'id'];

    const cambios = Array.from(allKeys)
      .filter(key => !excludeKeys.includes(key))
      .map(key => {
        const valorAnterior = anterior?.[key];
        const valorNuevo = nuevo?.[key];
        const cambio = JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo);

        if (!cambio && anterior && nuevo) return null;

        return { key, valorAnterior, valorNuevo, cambio };
      })
      .filter(Boolean);

    if (cambios.length === 0) {
      return <p className="text-sm text-muted-foreground">Sin cambios detectados</p>;
    }

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {cambios.map((item: any) => (
          <div key={item.key} className={cn(
            "p-2 rounded text-sm",
            item.cambio ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
          )}>
            <span className="font-medium text-gray-700">{item.key}:</span>
            {anterior && item.valorAnterior !== undefined && (
              <div className="ml-2 text-red-600 text-xs">
                <span className="text-gray-500">Antes: </span>
                {typeof item.valorAnterior === 'object' ? JSON.stringify(item.valorAnterior) : String(item.valorAnterior || '-')}
              </div>
            )}
            {nuevo && item.valorNuevo !== undefined && (
              <div className="ml-2 text-green-600 text-xs">
                <span className="text-gray-500">Después: </span>
                {typeof item.valorNuevo === 'object' ? JSON.stringify(item.valorNuevo) : String(item.valorNuevo || '-')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
        title="Ver historial de cambios"
      >
        <History className="h-4 w-4" />
        {size !== 'icon' && <span className="ml-1">Historial</span>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Cambios
            </DialogTitle>
            <DialogDescription>
              {TABLAS_AMIGABLES[tabla]} {boleta ? `• Boleta: ${boleta}` : `• ID: ${registroId}`}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay historial de cambios para este registro
            </div>
          ) : (
            <div className="space-y-4">
              {historial.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    selectedEntry?.id === entry.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAccionBadge(entry.accion)}
                      <span className="text-sm text-muted-foreground">
                        {formatDateTimeMST(entry.fecha_hora)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {getNombreUsuario(entry.usuario_email)}
                    </div>
                  </div>

                  {selectedEntry?.id === entry.id && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-xs text-muted-foreground">Cambios realizados:</Label>
                      <div className="mt-2">
                        {renderJsonDiff(entry.datos_anteriores, entry.datos_nuevos)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HistorialCambiosButton;

