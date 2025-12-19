import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load de páginas (carga solo cuando se necesitan)
const Login = lazy(() => import("./pages/Login"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const NuevoProveedor = lazy(() => import("./pages/NuevoProveedor"));
const Clientes = lazy(() => import("./pages/Clientes"));
const NuevoCliente = lazy(() => import("./pages/NuevoCliente"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Oficina = lazy(() => import("./pages/Oficina"));
const Reciba = lazy(() => import("./pages/Reciba"));
const Embarque = lazy(() => import("./pages/Embarque"));
const Movimientos = lazy(() => import("./pages/Movimientos"));
const Ingreso = lazy(() => import("./pages/Ingreso"));
const ControlCalidad = lazy(() => import("./pages/ControlCalidad"));
const Laboratorio = lazy(() => import("./pages/Laboratorio"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const EmergencyReset = lazy(() => import("./pages/EmergencyReset"));
const FixLogin = lazy(() => import("./pages/FixLogin"));

// Componente de carga
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - los datos se consideran frescos por 5 min
      cacheTime: 10 * 60 * 1000, // 10 minutos - mantener en caché por 10 min
      refetchOnWindowFocus: false, // No refetch al cambiar de ventana
      refetchOnMount: true, // Refetch al montar el componente
      retry: 1, // Reintentar 1 vez en caso de error
      retryDelay: 1000, // Esperar 1 segundo antes de reintentar
    },
    mutations: {
      retry: 0, // No reintentar mutaciones
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/emergency-reset" element={<EmergencyReset />} />
            <Route path="/fix-login" element={<FixLogin />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/oficina" 
              element={
                <ProtectedRoute requiredModule="oficina">
                  <Oficina />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reciba" 
              element={
                <ProtectedRoute requiredModule="reciba">
                  <Reciba />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reciba/nuevo" 
              element={
                <ProtectedRoute requiredModule="reciba">
                  <Reciba />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/embarque" 
              element={
                <ProtectedRoute requiredModule="embarque">
                  <Embarque />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/embarque/nuevo" 
              element={
                <ProtectedRoute requiredModule="embarque">
                  <Embarque />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/movimientos" 
              element={
                <ProtectedRoute requiredModule="movimientos">
                  <Movimientos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/proveedores" 
              element={
                <ProtectedRoute requiredModule="proveedores">
                  <Proveedores />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/proveedores/nuevo" 
              element={
                <ProtectedRoute requiredModule="proveedores">
                  <NuevoProveedor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clientes" 
              element={
                <ProtectedRoute requiredModule="clientes">
                  <Clientes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clientes/nuevo" 
              element={
                <ProtectedRoute requiredModule="clientes">
                  <NuevoCliente />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reportes" 
              element={
                <ProtectedRoute requiredModule="reportes">
                  <Reportes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ingreso" 
              element={
                <ProtectedRoute requiredModule="ingreso">
                  <Ingreso />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/control-calidad" 
              element={
                <ProtectedRoute requiredModule="control-calidad">
                  <ControlCalidad />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/laboratorio" 
              element={
                <ProtectedRoute requiredModule="laboratorio">
                  <Laboratorio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/configuracion" 
              element={
                <ProtectedRoute requiredModule="configuracion">
                  <Configuracion />
                </ProtectedRoute>
              } 
            />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
