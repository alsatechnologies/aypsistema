import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oficina" element={<Oficina />} />
          <Route path="/reciba" element={<Reciba />} />
          <Route path="/reciba/nuevo" element={<Reciba />} />
          <Route path="/embarque" element={<Embarque />} />
          <Route path="/embarque/nuevo" element={<Embarque />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/proveedores/nuevo" element={<NuevoProveedor />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/nuevo" element={<NuevoCliente />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/ingreso" element={<Ingreso />} />
          <Route path="/control-calidad" element={<ControlCalidad />} />
          <Route path="/laboratorio" element={<Laboratorio />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
