
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [usuarioOCorreo, setUsuarioOCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(usuarioOCorreo, contrasena);
    
    if (success) {
      const from = (location.state as any)?.from?.pathname || '/oficina';
      navigate(from, { replace: true });
    }
    
    setLoading(false);
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

