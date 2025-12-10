
import React from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryTab from '@/components/reports/InventoryTab';
import ReceptionTab from '@/components/reports/ReceptionTab';
import QualityTab from '@/components/reports/QualityTab';
import ProductionTab from '@/components/reports/ProductionTab';

const Reportes = () => {
  return (
    <Layout>
      <Header title="Reportes" />
      <div className="p-6">
        <Tabs defaultValue="inventario">
          <TabsList className="mb-6">
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="recepcion">Recepción</TabsTrigger>
            <TabsTrigger value="calidad">Calidad</TabsTrigger>
            <TabsTrigger value="produccion">Producción</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventario">
            <InventoryTab />
          </TabsContent>
          
          <TabsContent value="recepcion">
            <ReceptionTab />
          </TabsContent>
          
          <TabsContent value="calidad">
            <QualityTab />
          </TabsContent>

          <TabsContent value="produccion">
            <ProductionTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reportes;
