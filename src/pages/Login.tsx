
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from '@/components/Logo';
import { useAuth, rutaInicialPorRol } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Login = () => {
  const [usuarioOCorreo, setUsuarioOCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, usuario } = useAuth();
  const [loginExitoso, setLoginExitoso] = useState(false);

  // Tras iniciar sesión: volver a la pantalla pedida o ir a la primera que permite el rol
  useEffect(() => {
    if (!loginExitoso || !usuario) return;
    const from = (location.state as any)?.from?.pathname;
    navigate(from || rutaInicialPorRol(usuario.rol), { replace: true });
  }, [loginExitoso, usuario]);
  const { theme, setTheme } = useTheme();

  // Forzar modo claro en la página de login
  useEffect(() => {
    const originalTheme = theme;
    // Guardar el tema original si no está guardado
    if (!localStorage.getItem('originalTheme')) {
      localStorage.setItem('originalTheme', originalTheme);
    }
    // Forzar modo claro
    setTheme('light');
    
    // Restaurar el tema original cuando se desmonte el componente
    return () => {
      const savedOriginalTheme = localStorage.getItem('originalTheme') as 'light' | 'dark' | null;
      if (savedOriginalTheme) {
        setTheme(savedOriginalTheme);
        localStorage.removeItem('originalTheme');
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔵 Login.tsx: Iniciando proceso de login...');
      const success = await login(usuarioOCorreo, contrasena);
      console.log('🔵 Login.tsx: Resultado de login:', success);
      
      if (success) {
        console.log('🔵 Login.tsx: Login exitoso, navegando...');
        setLoginExitoso(true);
      } else {
        console.log('🔵 Login.tsx: Login falló');
      }
    } catch (error) {
      console.error('🔵 Login.tsx: Error en handleLogin:', error);
    } finally {
      console.log('🔵 Login.tsx: Finalizando, setLoading(false)');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-white p-10 flex flex-col justify-between">
        <div className="w-auto h-auto">
          <Logo />
        </div>
        
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-4xl font-bold mb-2">Hola,</h1>
          <h2 className="text-4xl font-bold mb-6">Bienvenido!</h2>
          <p className="text-gray-600 mb-8">Por favor ingresa tus claves de acceso</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input 
                type="text" 
                placeholder="Nombre de usuario" 
                value={usuarioOCorreo} 
                onChange={(e) => setUsuarioOCorreo(e.target.value)} 
                className="w-full mb-4"
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Contraseña" 
                value={contrasena} 
                onChange={(e) => setContrasena(e.target.value)} 
                className="w-full mb-2"
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </div>
        
        <div className="text-xs text-gray-400">
          V 1.0
        </div>
      </div>
      
      <div className="w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://i.ibb.co/Kc5KBdxZ/Recurso-1.png')" }}>
      </div>
    </div>
  );
};

export default Login;

