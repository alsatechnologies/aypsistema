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

  // Verificar sesión al cargar y escuchar cambios de autenticación
  useEffect(() => {
    verificarSesion();

    // Escuchar cambios en el estado de autenticación
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await cargarUsuarioDesdeAuth(session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const cargarUsuarioDesdeAuth = async (email: string) => {
    if (!supabase || !email) {
      setLoading(false);
      return;
    }

    try {
      // Obtener usuario desde la tabla usuarios usando el email de auth
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .eq('activo', true)
        .single();

      if (error || !data) {
        console.error('Error cargando usuario:', error);
        setUsuario(null);
        return;
      }

      setUsuario({
        id: data.id,
        nombre_completo: data.nombre_completo,
        nombre_usuario: data.nombre_usuario,
        correo: data.correo,
        rol: data.rol as Rol,
        activo: data.activo
      });
    } catch (error) {
      console.error('Error cargando usuario:', error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const verificarSesion = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Obtener sesión actual de Supabase Auth
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session || !session.user.email) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      // Cargar usuario desde la tabla usuarios
      await cargarUsuarioDesdeAuth(session.user.email);
    } catch (error) {
      console.error('Error verificando sesión:', error);
      setUsuario(null);
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
      
      // Buscar usuario por nombre_usuario PRIMERO (prioridad), luego por correo
      // Esto permite que el usuario ingrese solo su nombre de usuario
      let usuarioData = null;
      let usuarioError = null;
      
      // Intentar primero por nombre_usuario
      const { data: dataPorUsuario, error: errorPorUsuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nombre_usuario', busqueda)
        .eq('activo', true)
        .maybeSingle();
      
      if (dataPorUsuario && !errorPorUsuario) {
        usuarioData = dataPorUsuario;
      } else {
        // Si no se encuentra por nombre_usuario, buscar por correo
        const { data: dataPorCorreo, error: errorPorCorreo } = await supabase
          .from('usuarios')
          .select('*')
          .eq('correo', busqueda)
          .eq('activo', true)
          .maybeSingle();
        
        usuarioData = dataPorCorreo;
        usuarioError = errorPorCorreo;
      }

      if (usuarioError || !usuarioData) {
        console.error('Error buscando usuario:', usuarioError);
        console.log('Búsqueda realizada:', busqueda);
        toast.error('Usuario o contraseña incorrectos');
        return false;
      }

      console.log('Usuario encontrado:', usuarioData);

      // Validar que el rol sea válido
      const rolValido: Rol[] = ['Oficina', 'Portero', 'Báscula', 'Calidad', 'Laboratorio', 'Producción', 'Administrador'];
      if (!rolValido.includes(usuarioData.rol as Rol)) {
        console.error('Rol inválido:', usuarioData.rol);
        toast.error('Rol de usuario no válido');
        return false;
      }

      console.log('Intentando autenticar con:', usuarioData.correo);

      // Intentar iniciar sesión con Supabase Auth usando el correo
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: usuarioData.correo,
        password: contrasena
      });

      if (authError || !authData.user) {
        console.error('Error de autenticación:', authError);
        console.log('Email usado:', usuarioData.correo);
        toast.error('Usuario o contraseña incorrectos');
        return false;
      }

      console.log('Autenticación exitosa:', authData.user);

      // Cargar usuario completo desde la tabla usuarios
      await cargarUsuarioDesdeAuth(usuarioData.correo);
      
      toast.success(`Bienvenido, ${usuarioData.nombre_completo}`);
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error al iniciar sesión');
      return false;
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUsuario(null);
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Error en logout:', error);
      toast.error('Error al cerrar sesión');
    }
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

