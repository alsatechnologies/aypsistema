
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from '@/components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Normally would validate credentials here
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 bg-white p-10 flex flex-col justify-between">
        <div className="w-20 h-20">
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
                placeholder="Usuario" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full mb-4"
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Contraseña" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full mb-2"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Iniciar Sesión
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <a href="#" className="text-gray-500 text-sm hover:underline">Olvidé mi contraseña</a>
          </div>
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

