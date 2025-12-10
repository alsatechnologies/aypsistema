
import React from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArchiveIcon, TruckIcon, PackageIcon, AlertTriangleIcon, TrendingUpIcon, CalendarIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const Dashboard = () => {
  // Sample data for monthly metrics
  const monthlyData = [
    { name: 'Ene', recepciones: 65, salidas: 40 },
    { name: 'Feb', recepciones: 59, salidas: 45 },
    { name: 'Mar', recepciones: 80, salidas: 60 },
    { name: 'Abr', recepciones: 81, salidas: 70 },
    { name: 'May', recepciones: 56, salidas: 48 },
    { name: 'Jun', recepciones: 55, salidas: 50 },
    { name: 'Jul', recepciones: 40, salidas: 35 },
  ];

  // Mock data for quick stats
  const stats = [
    { 
      title: "Recepciones hoy", 
      value: "5", 
      trend: "+20%", 
      trendUp: true, 
      icon: TruckIcon,
      color: "text-blue-500",
      bgColor: "bg-blue-100" 
    },
    { 
      title: "Inventario actual", 
      value: "2,450", 
      unit: "kg",
      trend: "+5%", 
      trendUp: true, 
      icon: ArchiveIcon,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100"  
    },
    { 
      title: "Salidas hoy", 
      value: "3", 
      trend: "-10%", 
      trendUp: false, 
      icon: PackageIcon,
      color: "text-amber-500",
      bgColor: "bg-amber-100"  
    },
    { 
      title: "Alertas activas", 
      value: "2", 
      trend: "0%", 
      trendUp: null, 
      icon: AlertTriangleIcon,
      color: "text-red-500",
      bgColor: "bg-red-100"  
    },
  ];

  const config = {
    recepciones: { label: "Recepciones", theme: { light: "#6f2237", dark: "#6f2237" } },
    salidas: { label: "Salidas", theme: { light: "#60a5fa", dark: "#60a5fa" } },
  };

  // Mock data for upcoming deliveries
  const upcomingDeliveries = [
    { id: 1, supplier: "Semillas del Pacífico sa de cv", product: "Semilla de maíz", date: "16/04/2023", status: "Confirmado" },
    { id: 2, supplier: "Agrícola primavera sa de cv", product: "Semilla de cártamo", date: "17/04/2023", status: "Pendiente" },
    { id: 3, supplier: "Juan López Pérez", product: "Semilla de sorgo", date: "18/04/2023", status: "Confirmado" },
  ];

  return (
    <Layout>
      <Header title="Dashboard" />
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Panel de Control</h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">
                      {stat.value}
                      {stat.unit && <span className="text-sm font-normal ml-1">{stat.unit}</span>}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs ${stat.trendUp ? 'text-emerald-500' : stat.trendUp === false ? 'text-red-500' : 'text-gray-500'}`}>
                        {stat.trendUp ? '↑' : stat.trendUp === false ? '↓' : '='} {stat.trend}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs. ayer</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Activity Chart */}
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Actividad Mensual</CardTitle>
              <CardDescription>Recepciones y salidas registradas por mes</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ChartContainer className="h-80" config={config}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="recepciones" stroke="#6f2237" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="salidas" stroke="#60a5fa" />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
          {/* Upcoming Deliveries */}
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle>Próximas Entregas</CardTitle>
              <CardDescription>Entregas programadas para los próximos días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-start p-3 border rounded-lg">
                    <div className="p-2 rounded-lg bg-blue-100 mr-4">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{delivery.supplier}</p>
                      <p className="text-sm text-gray-500">{delivery.product}</p>
                      <div className="flex items-center mt-2">
                        <p className="text-xs text-gray-500">{delivery.date}</p>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          delivery.status === 'Confirmado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {delivery.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <a href="#" className="text-sm text-primary hover:underline">Ver todas las entregas programadas</a>
            </CardFooter>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas operaciones realizadas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4">
              {[
                { time: "11:32 AM", user: "Carlos Méndez", action: "Registró una nueva recepción de Semilla de maíz", icon: TruckIcon, iconBg: "bg-blue-100", iconColor: "text-blue-500" },
                { time: "10:15 AM", user: "Ana García", action: "Actualizó el inventario de la Bodega 3", icon: ArchiveIcon, iconBg: "bg-emerald-100", iconColor: "text-emerald-500" },
                { time: "09:45 AM", user: "Roberto Sánchez", action: "Registró una salida de Semilla de cártamo", icon: PackageIcon, iconBg: "bg-amber-100", iconColor: "text-amber-500" },
                { time: "Ayer", user: "María López", action: "Generó el reporte mensual de inventario", icon: TrendingUpIcon, iconBg: "bg-purple-100", iconColor: "text-purple-500" }
              ].map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className={`p-2 rounded-lg ${activity.iconBg} mr-4`}>
                    <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p>
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-gray-600"> {activity.action}</span>
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <a href="#" className="text-sm text-primary hover:underline">Ver todo el historial de actividad</a>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
