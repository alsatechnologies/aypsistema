
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import Layout from '../components/Layout';
import Header from '../components/Header';

const proveedorSchema = z.object({
  empresa: z.string().min(2, { message: "La empresa debe tener al menos 2 caracteres." }),
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  telefono: z.string().min(6, { message: "El teléfono debe tener al menos 6 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),
  ubicacion: z.string().min(2, { message: "La ubicación debe tener al menos 2 caracteres." }),
  columnaDemo: z.string().optional(),
});

type FormValues = z.infer<typeof proveedorSchema>;

const NuevoProveedor = () => {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      empresa: "",
      nombre: "",
      telefono: "",
      email: "",
      ubicacion: "",
      columnaDemo: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Datos del formulario:", data);
    // Aquí iría la lógica para guardar los datos del nuevo proveedor
    // Después de guardar, navegamos de vuelta a la lista de proveedores
    navigate('/proveedores');
  };

  return (
    <Layout>
      <Header title="Añadir Nuevo Proveedor" />
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de teléfono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ubicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad, País" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="columnaDemo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Columna Demo</FormLabel>
                        <FormControl>
                          <Input placeholder="Información adicional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/proveedores')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-hover"
                  >
                    Guardar Proveedor
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NuevoProveedor;
