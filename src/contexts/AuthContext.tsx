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
    if (!email) {
      console.warn('⚠️ No se puede cargar usuario: email no disponible');
      setLoading(false);
      return;
    }

    try {
      console.log('📥 Cargando usuario desde tabla usuarios, email:', email);
      
      // Buscar usuario directamente (get-user-by-email fue eliminado para reducir funciones)
      try {
        const response = await Promise.race([
          fetch('/api/get-user-for-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ busqueda: email }),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]) as Response;

        const result = await response.json();
        
        if (result.success && result.usuario) {
          console.log('✅ Usuario cargado vía serverless:', result.usuario);
          setUsuario({
            id: result.usuario.id,
            nombre_completo: result.usuario.nombre_completo,
            nombre_usuario: result.usuario.nombre_usuario,
            correo: result.usuario.correo,
            rol: result.usuario.rol as Rol,
            activo: result.usuario.activo
          });
          setLoading(false);
          return;
        }
      } catch (serverlessError) {
        console.warn('⚠️ Error con función serverless, intentando directo:', serverlessError);
      }

      // Fallback: intentar carga directa si serverless falla
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .eq('activo', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error cargando usuario:', error);
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

      console.log('✅ Usuario cargado exitosamente (directo):', data);

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

      console.log('🔍 Verificando sesión existente...');
      
      // Obtener sesión actual de Supabase Auth con timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout verificando sesión')), 5000)
      );

      let sessionResult;
      try {
        sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any;
      } catch (timeoutError) {
        console.error('❌ Timeout verificando sesión:', timeoutError);
        setUsuario(null);
        setLoading(false);
        return;
      }

      const { data: { session }, error } = sessionResult;

      if (error || !session || !session.user.email) {
        console.log('   No hay sesión activa');
        setUsuario(null);
        setLoading(false);
        return;
      }

      console.log('   Sesión encontrada, cargando usuario...');
      // Cargar usuario desde la tabla usuarios con timeout
      try {
        await Promise.race([
          cargarUsuarioDesdeAuth(session.user.email),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout cargando usuario')), 5000)
          )
        ]);
        console.log('   ✅ Usuario cargado');
      } catch (loadError) {
        console.error('❌ Error cargando usuario en verificarSesion:', loadError);
        setUsuario(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
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

      // Intentar autenticación usando función serverless (más confiable)
      console.log('   Llamando a función serverless para autenticar...');
      
      let authData = null;
      let authError = null;
      
      try {
        const authResponse = await Promise.race([
          fetch('/api/auth-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: usuarioData.correo,
              password: contrasena,
            }),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout en autenticación después de 15 segundos')), 15000)
          )
        ]) as Response;

        const result = await authResponse.json();
        
        if (result.success && result.user) {
          console.log('✅ Autenticación exitosa vía serverless');
          authData = { user: result.user, session: result.session };
          
          // Establecer la sesión en el cliente de Supabase (IMPORTANTE para RLS)
          if (supabase && result.session) {
            console.log('   Estableciendo sesión en cliente Supabase...');
            try {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: result.session.access_token,
                refresh_token: result.session.refresh_token,
              });
              
              if (sessionError) {
                console.error('❌ Error estableciendo sesión:', sessionError);
              } else {
                console.log('   ✅ Sesión establecida correctamente');
              }
            } catch (sessionErr) {
              console.error('❌ Error al establecer sesión:', sessionErr);
            }
          }
        } else {
          console.error('❌ Error en autenticación:', result.error);
          authError = { message: result.error || 'Error al autenticar' };
        }
      } catch (timeoutError) {
        console.error('❌ Timeout en autenticación:', timeoutError);
        // Fallback: intentar autenticación directa
        console.log('   Intentando autenticación directa como fallback...');
        try {
          const directAuth = await Promise.race([
            supabase.auth.signInWithPassword({
              email: usuarioData.correo,
              password: contrasena
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000)
            )
          ]) as any;
          
          if (directAuth.data && !directAuth.error) {
            console.log('✅ Autenticación exitosa (fallback directo)');
            authData = directAuth.data;
          } else {
            authError = directAuth.error || { message: 'Error al autenticar' };
          }
        } catch (fallbackError) {
          authError = { message: 'Error al autenticar. Verifica tu conexión y que el usuario exista en auth.users.' };
        }
      }

      if (authError) {
        // Si el error es que el usuario no existe en auth.users, intentar crearlo automáticamente
        if (authError.message?.includes('Invalid login credentials') || 
            authError.message?.includes('User not found')) {
          console.log('🔄 Usuario no existe en auth.users, intentando crearlo automáticamente...');
          
          try {
            const createAuthResponse = await fetch('/api/create-auth-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: usuarioData.correo,
                password: contrasena,
                nombre_completo: usuarioData.nombre_completo,
                nombre_usuario: usuarioData.nombre_usuario || null,
                rol: usuarioData.rol
              }),
            });

            if (createAuthResponse.ok) {
              console.log('✅ Usuario creado automáticamente en auth.users, reintentando login...');
              // Reintentar login después de crear el usuario
              const retryAuthResponse = await fetch('/api/auth-login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: usuarioData.correo,
                  password: contrasena,
                }),
              });

              const retryResult = await retryAuthResponse.json();
              
              if (retryResult.success && retryResult.user) {
                authData = { user: retryResult.user, session: retryResult.session };
                
                // Establecer la sesión en el cliente de Supabase
                if (supabase && retryResult.session) {
                  await supabase.auth.setSession({
                    access_token: retryResult.session.access_token,
                    refresh_token: retryResult.session.refresh_token,
                  });
                }
              } else {
                throw new Error(retryResult.error || 'Error al autenticar después de crear usuario');
              }
            } else {
              throw new Error('No se pudo crear usuario en auth.users');
            }
          } catch (autoCreateError) {
            console.error('❌ Error al crear usuario automáticamente:', autoCreateError);
            toast.error('Usuario o contraseña incorrectos. Si el problema persiste, contacta al administrador.');
            return false;
          }
        } else {
          console.error('❌ Error de autenticación:', authError);
          toast.error(authError.message || 'Usuario o contraseña incorrectos');
          return false;
        }
      }

      if (!authData?.user) {
        console.error('❌ No se recibió usuario de Supabase Auth');
        toast.error('Error al autenticar. Intenta de nuevo.');
        return false;
      }

      console.log('✅ Autenticación exitosa');
      console.log('   User ID:', authData.user.id);
      console.log('   Estableciendo usuario en contexto...');

      // Establecer el usuario INMEDIATAMENTE con los datos que ya tenemos
      const usuarioParaEstablecer: Usuario = {
        id: usuarioData.id,
        nombre_completo: usuarioData.nombre_completo,
        nombre_usuario: usuarioData.nombre_usuario,
        correo: usuarioData.correo,
        rol: usuarioData.rol as Rol,
        activo: usuarioData.activo
      };
      
      console.log('   Usuario a establecer:', usuarioParaEstablecer);
      setUsuario(usuarioParaEstablecer);
      setLoading(false); // IMPORTANTE: Marcar como no cargando
      console.log('   ✅ Usuario establecido en contexto, loading = false');
      
      // NO llamar a cargarUsuarioDesdeAuth aquí - ya tenemos todos los datos
      // Solo se llama automáticamente cuando hay cambios en la sesión de auth
      
      console.log('   Mostrando toast de bienvenida...');
      toast.success(`Bienvenido, ${usuarioData.nombre_completo}`);
      console.log('   ✅ Login completado, retornando true');
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

