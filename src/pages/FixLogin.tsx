import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const FixLogin = () => {
  const [password, setPassword] = useState('Admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [syncAll, setSyncAll] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Usar create-auth-user para crear/actualizar usuarios
      // Si syncAll está habilitado, crear todos los usuarios activos
      // Si no, solo crear el administrador
      if (syncAll) {
        // Obtener lista de usuarios y crear cada uno
        const usuariosResponse = await fetch('/api/get-user-for-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ busqueda: 'administrador' }),
        });
        // Por ahora, solo crear administrador si syncAll está marcado
        // (en el futuro se puede expandir para crear todos)
        const endpoint = '/api/create-auth-user';
        const body = {
          email: 'administrador@apsistema.com',
          password: password || 'Admin123',
          nombre_completo: 'Administrador',
          nombre_usuario: 'administrador',
          rol: 'Administrador'
        };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        
        const data = await response.json();
        setResult(data);
        
        if (data.success) {
          toast.success('Usuario sincronizado correctamente');
        } else {
          toast.error(data.error || 'Error al sincronizar usuario');
        }
        return;
      }
      
      // Solo crear administrador
      const endpoint = '/api/create-auth-user';
      const body = {
        email: 'administrador@apsistema.com',
        password: password || 'Admin123',
        nombre_completo: 'Administrador',
        nombre_usuario: 'administrador',
        rol: 'Administrador'
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(data.message || 'Usuarios sincronizados correctamente');
      } else {
        toast.error(data.error || 'Error al sincronizar usuarios');
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
          Sincroniza usuarios con Supabase Auth para permitir el login.
        </p>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="syncAll"
              checked={syncAll}
              onChange={(e) => setSyncAll(e.target.checked)}
              disabled={loading}
              className="w-4 h-4"
            />
            <label htmlFor="syncAll" className="text-sm font-medium">
              Sincronizar TODOS los usuarios (recomendado)
            </label>
          </div>

          {!syncAll && (
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
          )}

          <Button
            onClick={handleFix}
            disabled={loading}
            className="w-full"
          >
            {loading 
              ? 'Sincronizando...' 
              : syncAll 
                ? 'Sincronizar Todos los Usuarios' 
                : 'Sincronizar Usuario Administrador'}
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

          {result?.summary && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <h4 className="font-semibold mb-2">Resumen:</h4>
              <ul className="text-sm space-y-1">
                <li>Total: {result.summary.total}</li>
                <li className="text-green-600">Creados: {result.summary.created}</li>
                <li className="text-blue-600">Actualizados: {result.summary.updated}</li>
                {result.summary.errors > 0 && (
                  <li className="text-red-600">Errores: {result.summary.errors}</li>
                )}
              </ul>
              {result.results?.created && result.results.created.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-1">Usuarios creados:</p>
                  <ul className="text-xs space-y-1">
                    {result.results.created.map((u: any, i: number) => (
                      <li key={i}>
                        {u.email} - Contraseña: {u.password}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
              <li>Marca "Sincronizar TODOS los usuarios" (recomendado) o solo el administrador</li>
              <li>Si solo sincronizas el administrador, ingresa la contraseña deseada</li>
              <li>Haz clic en el botón de sincronización</li>
              <li>Espera a que se complete la sincronización</li>
              <li>Intenta iniciar sesión con el usuario y contraseña mostrados</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixLogin;

