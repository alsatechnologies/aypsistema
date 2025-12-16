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
      console.warn('⚠️ No se puede cargar usuario: supabase o email no disponible');
      setLoading(false);
      return;
    }

    try {
      console.log('📥 Cargando usuario desde tabla usuarios, email:', email);
      
      // Obtener usuario desde la tabla usuarios usando el email de auth
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .eq('activo', true)
        .single();

      if (error) {
        console.error('❌ Error cargando usuario:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
        setUsuario(null);
        setLoading(false);
        return;
      }

      if (!data) {
        console.warn('⚠️ Usuario no encontrado en tabla usuarios para email:', email);
        setUsuario(null);
        setLoading(false);
        return;
      }

      console.log('✅ Usuario cargado exitosamente:', data);

      setUsuario({
        id: data.id,
        nombre_completo: data.nombre_completo,
        nombre_usuario: data.nombre_usuario,
        correo: data.correo,
        rol: data.rol as Rol,
        activo: data.activo
      });
    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
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
        console.error('❌ Supabase no está configurado');
        console.error('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
        console.error('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NO CONFIGURADA');
        toast.error('Supabase no está configurado. Verifica las variables de entorno en Vercel.');
        return false;
      }

      const busqueda = usuarioOCorreo.toLowerCase().trim();
      console.log('🔐 Iniciando login para:', busqueda);
      
      // Buscar usuario usando función serverless (más confiable)
      console.log('🔍 Buscando usuario...');
      let usuarioData = null;
      let usuarioError = null;
      
      try {
        console.log('   Llamando a función serverless para buscar usuario...');
        const searchResponse = await Promise.race([
          fetch('/api/get-user-for-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ busqueda }),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout en búsqueda después de 5 segundos')), 5000)
          )
        ]) as Response;

        const result = await searchResponse.json();
        
        if (result.success && result.usuario) {
          console.log('✅ Usuario encontrado:', result.usuario);
          usuarioData = result.usuario;
        } else {
          console.error('❌ Error en búsqueda:', result.error);
          usuarioError = { message: result.error || 'Usuario no encontrado' };
        }
      } catch (timeoutError) {
        console.error('❌ Timeout en búsqueda:', timeoutError);
        // Fallback: intentar búsqueda directa si la función serverless falla
        console.log('   Intentando búsqueda directa como fallback...');
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('activo', true)
            .or(`nombre_usuario.eq.${busqueda},correo.eq.${busqueda}`)
            .maybeSingle();
          
          if (data && !error) {
            console.log('✅ Usuario encontrado (fallback directo)');
            usuarioData = data;
          } else {
            usuarioError = error || { message: 'Usuario no encontrado' };
          }
        } catch (fallbackError) {
          usuarioError = { message: 'Error al buscar usuario. Verifica tu conexión y las variables de entorno en Vercel.' };
        }
      }

      if (usuarioError) {
        console.error('❌ Error buscando usuario:', usuarioError);
        console.log('Búsqueda realizada:', busqueda);
        toast.error('Error al buscar usuario. Verifica tu conexión.');
        return false;
      }

      if (!usuarioData) {
        console.log('❌ Usuario no encontrado');
        console.log('Búsqueda realizada:', busqueda);
        toast.error('Usuario o contraseña incorrectos');
        return false;
      }

      console.log('✅ Usuario encontrado:', usuarioData);

      // Validar que el rol sea válido
      const rolValido: Rol[] = ['Oficina', 'Portero', 'Báscula', 'Calidad', 'Laboratorio', 'Producción', 'Administrador'];
      if (!rolValido.includes(usuarioData.rol as Rol)) {
        console.error('❌ Rol inválido:', usuarioData.rol);
        toast.error('Rol de usuario no válido');
        return false;
      }

      console.log('🔑 Intentando autenticar con Supabase Auth...');
      console.log('   Email:', usuarioData.correo);
      console.log('   Contraseña proporcionada:', contrasena ? '***' : 'NO');
      console.log('   Supabase URL:', supabase?.supabaseUrl || 'No disponible');
      console.log('   Supabase Key:', supabase?.supabaseKey ? 'Configurada' : 'NO CONFIGURADA');

      // Intentar iniciar sesión con Supabase Auth usando el correo
      console.log('   Llamando a signInWithPassword...');
      
      let authResult;
      try {
        const authPromise = supabase.auth.signInWithPassword({
          email: usuarioData.correo,
          password: contrasena
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout en signInWithPassword después de 10 segundos')), 10000);
        });

        authResult = await Promise.race([authPromise, timeoutPromise]) as any;
        console.log('   Respuesta recibida de signInWithPassword');
        console.log('   Resultado:', authResult ? 'OK' : 'NULL');
      } catch (timeoutError) {
        console.error('❌ Timeout en autenticación:', timeoutError);
        console.error('   Esto puede indicar:');
        console.error('   1. Problema de conexión a Supabase');
        console.error('   2. La contraseña es incorrecta');
        console.error('   3. El usuario no existe en auth.users');
        console.error('   4. Variables de entorno no configuradas');
        toast.error('La autenticación está tardando demasiado. Verifica tu conexión y que las variables de entorno estén configuradas en Vercel.');
        return false;
      }

      const authData = authResult?.data;
      const authError = authResult?.error;

      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        console.log('   Email usado:', usuarioData.correo);
        console.log('   Código de error:', authError.status);
        console.log('   Mensaje:', authError.message);
        toast.error(authError.message || 'Usuario o contraseña incorrectos');
        return false;
      }

      if (!authData?.user) {
        console.error('❌ No se recibió usuario de Supabase Auth');
        toast.error('Error al autenticar. Intenta de nuevo.');
        return false;
      }

      console.log('✅ Autenticación exitosa con Supabase Auth');
      console.log('   User ID:', authData.user.id);
      console.log('   Email confirmado:', authData.user.email_confirmed_at ? 'Sí' : 'No');

      // Cargar usuario completo desde la tabla usuarios
      console.log('📥 Cargando datos del usuario desde tabla usuarios...');
      try {
        await Promise.race([
          cargarUsuarioDesdeAuth(usuarioData.correo),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout cargando usuario después de 5 segundos')), 5000);
          })
        ]);
        console.log('✅ Usuario cargado correctamente');
      } catch (timeoutError) {
        console.error('❌ Timeout cargando usuario:', timeoutError);
        // Continuar de todas formas, el usuario ya está autenticado
      }
      
      toast.success(`Bienvenido, ${usuarioData.nombre_completo}`);
      return true;
    } catch (error) {
      console.error('❌ Error en login:', error);
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
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

