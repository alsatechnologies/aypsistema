/**
 * PÁGINA DE EMERGENCIA - SOLO PARA USO TEMPORAL
 * Permite resetear la contraseña del administrador cuando el login falla
 * ELIMINAR DESPUÉS DE USAR
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const EmergencyReset = () => {
  const [password, setPassword] = useState('Admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Usar update-auth-user en lugar de reset-admin-password-direct (eliminado)
      const response = await fetch('/api/update-auth-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'administrador@apsistema.com',
          password: password 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: `Contraseña actualizada. Email: administrador@apsistema.com, Password: ${password}`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error desconocido',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al conectar con el servidor',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Reset de Emergencia
          </CardTitle>
          <CardDescription>
            Solo usar cuando el login falla completamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nueva Contraseña</label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin123"
            />
          </div>

          <Button
            onClick={handleReset}
            disabled={loading || !password}
            className="w-full"
            variant="destructive"
          >
            {loading ? 'Reseteando...' : 'Resetear Contraseña del Administrador'}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>⚠️ Esta página debe eliminarse después de usar</p>
            <p>📧 Email: administrador@apsistema.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyReset;

