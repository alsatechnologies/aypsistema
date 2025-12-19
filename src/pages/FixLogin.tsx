import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const FixLogin = () => {
  const [password, setPassword] = useState('Admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fix-admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password || 'Admin123',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(data.message || 'Usuario administrador sincronizado correctamente');
      } else {
        toast.error(data.error || 'Error al sincronizar usuario');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
      setResult({ success: false, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Fix de Login</h1>
        <p className="text-gray-600 mb-6 text-center">
          Este endpoint sincroniza el usuario administrador con Supabase Auth.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Contraseña para el usuario administrador:
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin123"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si dejas vacío, se usará "Admin123" por defecto
            </p>
          </div>

          <Button
            onClick={handleFix}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sincronizando...' : 'Sincronizar Usuario Administrador'}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅ Éxito' : '❌ Error'}
              </h3>
              <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message || result.error}
              </p>
              {result.action && (
                <p className="text-xs text-gray-600 mt-2">
                  Acción realizada: {result.action === 'created' ? 'Usuario creado' : 'Usuario actualizado'}
                </p>
              )}
              {result.user && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Email: {result.user.email}</p>
                  <p>ID: {result.user.id}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
              <li>Ingresa la contraseña que quieres usar para el usuario administrador</li>
              <li>Haz clic en "Sincronizar Usuario Administrador"</li>
              <li>Espera a que se complete la sincronización</li>
              <li>Intenta iniciar sesión con: usuario "administrador" y la contraseña que especificaste</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixLogin;

