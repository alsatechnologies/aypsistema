import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Proveedores from "./pages/Proveedores";
import NuevoProveedor from "./pages/NuevoProveedor";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Reportes from "./pages/Reportes";
import Oficina from "./pages/Oficina";
import Reciba from "./pages/Reciba";
import Embarque from "./pages/Embarque";
import Movimientos from "./pages/Movimientos";
import Ingreso from "./pages/Ingreso";
import ControlCalidad from "./pages/ControlCalidad";
import Laboratorio from "./pages/Laboratorio";
import Configuracion from "./pages/Configuracion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
