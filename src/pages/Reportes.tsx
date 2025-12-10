import React from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Reportes = () => {
  return (
    <Layout>
      <Header title="Reportes" subtitle="Generación de reportes del sistema" />
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">Módulo en desarrollo</h2>
            <p className="text-muted-foreground text-center">
              Esta funcionalidad estará disponible próximamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reportes;