import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type Rol = 'Oficina' | 'Portero' | 'Báscula' | 'Calidad' | 'Laboratorio' | 'Producción' | 'Administrador';

export interface Usuario {
  id: number;
  nombre_completo: string;
  nombre_usuario?: string | null;
  correo: string;
  rol: Rol;
  activo: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (correo: string, contrasena: string) => Promise<boolean>;
  logout: () => void;
  tienePermiso: (modulo: string) => boolean;
  esAdministrador: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapeo de roles a módulos permitidos
const permisosPorRol: Record<Rol, string[]> = {
  'Oficina': ['oficina', 'movimientos', 'proveedores', 'clientes', 'reportes'],
  'Portero': ['ingreso'],
  'Báscula': ['reciba', 'embarque', 'movimientos', 'reportes', 'configuracion'],
  'Calidad': ['control-calidad'],
  'Laboratorio': ['laboratorio'],
  'Producción': ['produccion'],
  'Administrador': ['oficina', 'reciba', 'embarque', 'movimientos', 'proveedores', 'clientes', 'reportes', 'ingreso', 'control-calidad', 'laboratorio', 'produccion', 'configuracion']
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const usuarioId = localStorage.getItem('usuario_id');
      if (!usuarioId) {
        setLoading(false);
        return;
      }

      // Obtener usuario desde Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', parseInt(usuarioId))
          .eq('activo', true)
          .single();

        if (error || !data) {
          localStorage.removeItem('usuario_id');
          setUsuario(null);
        } else {
          setUsuario(data as Usuario);
        }
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      localStorage.removeItem('usuario_id');
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usuarioOCorreo: string, contrasena: string): Promise<boolean> => {
    try {
      if (!supabase) {
        toast.error('Supabase no está configurado');
        return false;
      }

      const busqueda = usuarioOCorreo.toLowerCase().trim();
      
      // Buscar usuario por nombre_usuario O correo
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .or(`nombre_usuario.eq.${busqueda},correo.eq.${busqueda}`)
        .eq('activo', true)
        .single();

      if (usuarioError || !usuarioData) {
        toast.error('Usuario o contraseña incorrectos');
        return false;
      }

      // Verificar contraseña
      // NOTA: En producción deberías usar bcrypt.compare() o similar
      // Por ahora, comparación directa (para desarrollo/testing)
      // TODO: Implementar hash de contraseñas correctamente con bcrypt
      if (usuarioData.contrasena_hash !== contrasena) {
        toast.error('Usuario o contraseña incorrectos');
        return false;
      }

      // Validar que el rol sea válido
      const rolValido: Rol[] = ['Oficina', 'Portero', 'Báscula', 'Calidad', 'Laboratorio', 'Producción', 'Administrador'];
      if (!rolValido.includes(usuarioData.rol as Rol)) {
        toast.error('Rol de usuario no válido');
        return false;
      }

      // Guardar sesión
      localStorage.setItem('usuario_id', usuarioData.id.toString());
      setUsuario({
        id: usuarioData.id,
        nombre_completo: usuarioData.nombre_completo,
        nombre_usuario: usuarioData.nombre_usuario,
        correo: usuarioData.correo,
        rol: usuarioData.rol as Rol,
        activo: usuarioData.activo
      });
      toast.success(`Bienvenido, ${usuarioData.nombre_completo}`);
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error al iniciar sesión');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('usuario_id');
    setUsuario(null);
    toast.success('Sesión cerrada');
  };

  const tienePermiso = (modulo: string): boolean => {
    if (!usuario) return false;
    if (usuario.rol === 'Administrador') return true;
    
    const modulosPermitidos = permisosPorRol[usuario.rol] || [];
    return modulosPermitidos.includes(modulo.toLowerCase());
  };

  const esAdministrador = (): boolean => {
    return usuario?.rol === 'Administrador';
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      loading,
      login,
      logout,
      tienePermiso,
      esAdministrador
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

