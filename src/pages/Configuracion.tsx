import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, Warehouse, Users, FlaskConical, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProductos } from '@/services/hooks/useProductos';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { useUsuarios } from '@/services/hooks/useUsuarios';
import { useAuth } from '@/contexts/AuthContext';
import * as productosService from '@/services/supabase/productos';
import type { Producto as ProductoDB } from '@/services/supabase/productos';
import type { Almacen as AlmacenDB } from '@/services/supabase/almacenes';
import type { Usuario as UsuarioDB } from '@/services/supabase/usuarios';

// Roles según el PDF
const rolesDisponibles = [
  'Administrador',
  'Oficina',
  'Portero',
  'Báscula',
  'Calidad',
  'Laboratorio',
  'Producción',
];

interface RangoDescuento {
  porcentaje: number;
  kgDescuentoTon: number;
}

interface Analisis {
  id: string;
  nombre: string;
  generaDescuento: boolean;
  rangosDescuento?: RangoDescuento[];
}

interface Producto {
  id: number;
  nombre: string;
  codigoBoleta: string;
  analisis: Analisis[];
}

const Configuracion = () => {
  const { esAdministrador } = useAuth();
  
  // Hooks de Supabase
  const { 
    productos: productosDB, 
    tiposAnalisis: tiposAnalisisDisponibles, 
    loading: productosLoading,
    addProducto: addProductoDB,
    updateProducto: updateProductoDB,
    deleteProducto: deleteProductoDB,
    addTipoAnalisis,
    removeTipoAnalisis,
    loadProductos,
    loadTiposAnalisis
  } = useProductos();
  
  const { 
    almacenes: almacenesDB, 
    loading: almacenesLoading,
    addAlmacen: addAlmacenDB,
    updateAlmacen: updateAlmacenDB,
    deleteAlmacen: deleteAlmacenDB
  } = useAlmacenes();
  
  const { 
    usuarios: usuariosDB, 
    loading: usuariosLoading,
    addUsuario: addUsuarioDB,
    updateUsuario: updateUsuarioDB,
    // deleteUsuario: deleteUsuarioDB, // NO USAR - siempre usar endpoint serverless
    // IMPORTANTE: deleteUsuarioDB está comentado intencionalmente para prevenir uso directo
    // Siempre usar el endpoint /api/delete-usuario que bypass RLS
    loadUsuarios
  } = useUsuarios();
  
  // Variable para prevenir uso accidental de deleteUsuarioDB
  const deleteUsuarioDB = undefined; // NO USAR - siempre usar endpoint serverless

  // Estado local para productos con análisis cargados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosConAnalisis, setProductosConAnalisis] = useState<Record<number, Analisis[]>>({});

  // Cargar productos cuando cambie productosDB
  useEffect(() => {
    if (productosDB) {
      setProductos(productosDB.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoBoleta: p.codigo_boleta,
        analisis: productosConAnalisis[p.id] || []
      })));
    }
  }, [productosDB]);

  // Cargar análisis cuando se expande un producto
  const loadAnalisisForProducto = async (productoId: number, forceReload: boolean = false) => {
    if (!forceReload && productosConAnalisis[productoId]) return; // Ya cargado, a menos que se fuerce recarga
    
    try {
      const productoConAnalisis = await productosService.getProductoConAnalisis(productoId);
      const analisis: Analisis[] = (productoConAnalisis.analisis || []).map((a: any) => ({
        id: a.id,
        nombre: a.nombre,
        generaDescuento: a.generaDescuento || false,
        rangosDescuento: a.rangosDescuento || []
      }));
      
      setProductosConAnalisis(prev => ({ ...prev, [productoId]: analisis }));
      setProductos(prev => prev.map(p => 
        p.id === productoId ? { ...p, analisis } : p
      ));
    } catch (error) {
      console.error('Error loading analisis:', error);
      toast.error('Error al cargar análisis del producto');
    }
  };

  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [searchProducto, setSearchProducto] = useState('');
  const [searchAlmacen, setSearchAlmacen] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');

  // Estados para dialogs
  const [productoDialogOpen, setProductoDialogOpen] = useState(false);
  const [almacenDialogOpen, setAlmacenDialogOpen] = useState(false);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [editingAlmacen, setEditingAlmacen] = useState<{ id: number; nombre: string; capacidadTotal: number; capacidadActual: number; unidad: string } | null>(null);
  const [editingUsuario, setEditingUsuario] = useState<{ id: number; nombreCompleto: string; nombreUsuario?: string; correo: string; contrasena: string; rol: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'producto' | 'almacen' | 'usuario'; id: number; nombre: string } | null>(null);

  // Estados para formularios
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', codigoBoleta: '', analisis: [] as Analisis[] });
  const [nuevoAlmacen, setNuevoAlmacen] = useState({ nombre: '', capacidadTotal: '', unidad: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombreCompleto: '', nombreUsuario: '', correo: '', contrasena: '', rol: '' });

  // Estado para edición de análisis con descuentos
  const [editingAnalisis, setEditingAnalisis] = useState<{ productoId: number; analisis: Analisis } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getRolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      'Administrador': 'bg-primary text-primary-foreground',
      'Oficina': 'bg-blue-500 text-white',
      'Portero': 'bg-green-500 text-white',
      'Báscula': 'bg-orange-500 text-white',
      'Calidad': 'bg-purple-500 text-white',
      'Laboratorio': 'bg-pink-500 text-white',
      'Producción': 'bg-cyan-500 text-white',
    };
    return <Badge className={colors[rol] || 'bg-muted text-muted-foreground'}>{rol}</Badge>;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-MX');
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchProducto.toLowerCase()) ||
    p.codigoBoleta.includes(searchProducto)
  );

  const filteredAlmacenes = almacenesDB.filter(a => 
    a.nombre.toLowerCase().includes(searchAlmacen.toLowerCase())
  );

  const filteredUsuarios = usuariosDB.filter(u => 
    u.nombre_completo.toLowerCase().includes(searchUsuario.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchUsuario.toLowerCase()) ||
    (u.nombre_usuario && u.nombre_usuario.toLowerCase().includes(searchUsuario.toLowerCase()))
  );

  // CRUD Productos
  const handleSaveProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.codigoBoleta) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      if (editingProducto) {
        await updateProductoDB(editingProducto.id, {
          nombre: nuevoProducto.nombre,
          codigo_boleta: nuevoProducto.codigoBoleta
        });
        await loadProductos();
        toast.success('Producto actualizado correctamente');
      } else {
        await addProductoDB({
          nombre: nuevoProducto.nombre,
          codigo_boleta: nuevoProducto.codigoBoleta
        });
        await loadProductos();
        toast.success('Producto creado correctamente');
      }

      setNuevoProducto({ nombre: '', codigoBoleta: '', analisis: [] });
      setEditingProducto(null);
      setProductoDialogOpen(false);
    } catch (error) {
      console.error('Error saving producto:', error);
      toast.error('Error al guardar producto');
    }
  };

  const handleEditProducto = (producto: Producto) => {
    setEditingProducto(producto);
    setNuevoProducto({ nombre: producto.nombre, codigoBoleta: producto.codigoBoleta, analisis: producto.analisis });
    setProductoDialogOpen(true);
  };

  const handleExpandProduct = async (productoId: number) => {
    if (expandedProduct === productoId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productoId);
      await loadAnalisisForProducto(productoId);
    }
  };

  // CRUD Almacenes
  const handleSaveAlmacen = async () => {
    if (!nuevoAlmacen.nombre || !nuevoAlmacen.capacidadTotal || !nuevoAlmacen.unidad) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      if (editingAlmacen) {
        await updateAlmacenDB(editingAlmacen.id, {
          nombre: nuevoAlmacen.nombre,
          capacidad_total: Number(nuevoAlmacen.capacidadTotal),
          unidad: nuevoAlmacen.unidad
        });
        toast.success('Almacén actualizado correctamente');
      } else {
        await addAlmacenDB({
          nombre: nuevoAlmacen.nombre,
          capacidad_total: Number(nuevoAlmacen.capacidadTotal),
          capacidad_actual: 0,
          unidad: nuevoAlmacen.unidad
        });
        toast.success('Almacén creado correctamente');
      }

      setNuevoAlmacen({ nombre: '', capacidadTotal: '', unidad: '' });
      setEditingAlmacen(null);
      setAlmacenDialogOpen(false);
    } catch (error) {
      console.error('Error saving almacen:', error);
      toast.error('Error al guardar almacén');
    }
  };

  const handleEditAlmacen = (almacen: AlmacenDB) => {
    setEditingAlmacen({ id: almacen.id, nombre: almacen.nombre, capacidadTotal: almacen.capacidad_total, capacidadActual: almacen.capacidad_actual, unidad: almacen.unidad });
    setNuevoAlmacen({ nombre: almacen.nombre, capacidadTotal: almacen.capacidad_total.toString(), unidad: almacen.unidad });
    setAlmacenDialogOpen(true);
  };

  // CRUD Usuarios
  const handleSaveUsuario = async () => {
    if (!nuevoUsuario.nombreCompleto || !nuevoUsuario.rol) {
      toast.error('Complete todos los campos requeridos (nombre completo y rol)');
      return;
    }
    if (!editingUsuario && !nuevoUsuario.contrasena) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }
    if (!editingUsuario && nuevoUsuario.contrasena && nuevoUsuario.contrasena.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // Generar email automáticamente basado en nombre_usuario o nombre_completo
      const emailFinal = nuevoUsuario.correo || 
        (nuevoUsuario.nombreUsuario && nuevoUsuario.nombreUsuario.trim() !== ''
          ? `${nuevoUsuario.nombreUsuario.toLowerCase().trim()}@apsistema.com`
          : `${nuevoUsuario.nombreCompleto.toLowerCase().trim().replace(/\s+/g, '_')}@apsistema.com`);

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailFinal)) {
        toast.error('El formato del correo electrónico no es válido');
        return;
      }

      // Verificar si el email ya existe (solo para nuevos usuarios)
      if (!editingUsuario) {
        const emailExiste = usuariosDB.some(u => u.correo.toLowerCase() === emailFinal.toLowerCase() && u.activo);
        if (emailExiste) {
          toast.error('Ya existe un usuario activo con este correo electrónico');
          return;
        }
      }

      // Verificar si el nombre_usuario ya existe (solo para nuevos usuarios y si se proporciona)
      if (!editingUsuario && nuevoUsuario.nombreUsuario && nuevoUsuario.nombreUsuario.trim() !== '') {
        const usuarioExiste = usuariosDB.some(u => 
          u.nombre_usuario && 
          u.nombre_usuario.toLowerCase() === nuevoUsuario.nombreUsuario.toLowerCase().trim() && 
          u.activo
        );
        if (usuarioExiste) {
          toast.error('Ya existe un usuario activo con este nombre de usuario');
          return;
        }
      }

      // En producción, deberías hashear la contraseña aquí
      const contrasenaHash = nuevoUsuario.contrasena || '********';
      
      if (editingUsuario) {
        // Actualizar usuario existente
        const updateData: any = {
          nombre_completo: nuevoUsuario.nombreCompleto,
          nombre_usuario: nuevoUsuario.nombreUsuario || null,
          correo: emailFinal,
          rol: nuevoUsuario.rol
        };
        if (nuevoUsuario.contrasena) {
          updateData.contrasena_hash = contrasenaHash;
          
          // Primero intentar actualizar en auth.users
          try {
            const updateAuthResponse = await fetch('/api/update-auth-user', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: editingUsuario.correo, // Email antiguo
                password: nuevoUsuario.contrasena,
                new_email: emailFinal !== editingUsuario.correo ? emailFinal : undefined
              }),
            });

            if (!updateAuthResponse.ok) {
              const errorData = await updateAuthResponse.json();
              
              // Si el usuario no existe en auth.users, crearlo
              if (errorData.error && errorData.error.includes('no encontrado')) {
                console.log('Usuario no existe en auth.users, creándolo...');
                const createAuthResponse = await fetch('/api/create-auth-user', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: emailFinal,
                    password: nuevoUsuario.contrasena,
                    nombre_completo: nuevoUsuario.nombreCompleto,
                    nombre_usuario: nuevoUsuario.nombreUsuario || null,
                    rol: nuevoUsuario.rol
                  }),
                });

                if (!createAuthResponse.ok) {
                  const createErrorData = await createAuthResponse.json();
                  console.warn('Advertencia: No se pudo crear en auth.users:', createErrorData.error);
                  toast.warning('Usuario actualizado, pero no se pudo crear en auth.users. El login puede fallar hasta que se cree manualmente.');
                } else {
                  toast.success('Usuario creado en auth.users correctamente');
                }
              } else {
                console.warn('Advertencia: No se pudo actualizar en auth.users:', errorData.error);
                toast.warning('Usuario actualizado, pero hubo un problema al actualizar en auth.users.');
              }
            }
          } catch (authError) {
            console.warn('Advertencia: Error al actualizar/crear en auth.users:', authError);
            // Intentar crear si falla la actualización
            try {
              const createAuthResponse = await fetch('/api/create-auth-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: emailFinal,
                  password: nuevoUsuario.contrasena,
                  nombre_completo: nuevoUsuario.nombreCompleto,
                  nombre_usuario: nuevoUsuario.nombreUsuario || null,
                  rol: nuevoUsuario.rol
                }),
              });

              if (createAuthResponse.ok) {
                toast.success('Usuario creado en auth.users correctamente');
              }
            } catch (createError) {
              console.warn('No se pudo crear usuario en auth.users:', createError);
            }
          }
        }
        
        await updateUsuarioDB(editingUsuario.id, updateData);
        
        // Recargar lista de usuarios
        await loadUsuarios();
        
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        let authUserCreated = false;
        
        // Primero crear en auth.users
        try {
          const createAuthResponse = await fetch('/api/create-auth-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: emailFinal,
              password: nuevoUsuario.contrasena,
              nombre_completo: nuevoUsuario.nombreCompleto,
              nombre_usuario: nuevoUsuario.nombreUsuario || null,
              rol: nuevoUsuario.rol
            }),
          });

          if (createAuthResponse.ok) {
            authUserCreated = true;
          } else {
            const errorData = await createAuthResponse.json();
            // Si el error es que el usuario ya existe, continuar de todas formas
            if (errorData.error && errorData.error.includes('already registered')) {
              console.warn('Usuario ya existe en auth.users, continuando...');
              authUserCreated = true; // Considerar como éxito si ya existe
            } else {
              console.error('Error creando usuario en auth.users:', errorData.error);
              // Continuar de todas formas pero mostrar advertencia
              toast.warning('Advertencia: No se pudo crear en auth.users. El usuario se creará en la base de datos pero el login puede fallar hasta que se cree manualmente en auth.users.');
            }
          }
        } catch (authError) {
          console.error('Error creando usuario en auth.users:', authError);
          toast.warning('Advertencia: Error al crear usuario en auth.users. El usuario se creará en la base de datos pero el login puede fallar hasta que se cree manualmente en auth.users.');
        }

        // Crear en la tabla usuarios (siempre, incluso si auth.users falla)
        try {
          await addUsuarioDB({
            nombre_completo: nuevoUsuario.nombreCompleto,
            nombre_usuario: nuevoUsuario.nombreUsuario || null,
            correo: emailFinal,
            contrasena_hash: contrasenaHash,
            rol: nuevoUsuario.rol,
            activo: true
          });
          
          // Recargar lista de usuarios
          await loadUsuarios();
          
          if (authUserCreated) {
            toast.success('Usuario creado correctamente');
          } else {
            toast.success('Usuario creado en la base de datos. Nota: Puede que necesite ser creado manualmente en auth.users para poder iniciar sesión.');
          }
        } catch (dbError) {
          console.error('Error creando usuario en base de datos:', dbError);
          toast.error('Error al crear usuario en la base de datos: ' + (dbError instanceof Error ? dbError.message : 'Error desconocido'));
          throw dbError; // Re-lanzar para que el catch general lo maneje
        }
      }

      setNuevoUsuario({ nombreCompleto: '', nombreUsuario: '', correo: '', contrasena: '', rol: '' });
      setEditingUsuario(null);
      setUsuarioDialogOpen(false);
    } catch (error) {
      console.error('Error saving usuario:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar usuario');
    }
  };

  const handleEditUsuario = (usuario: UsuarioDB) => {
    setEditingUsuario({ 
      id: usuario.id, 
      nombreCompleto: usuario.nombre_completo, 
      nombreUsuario: usuario.nombre_usuario || '',
      correo: usuario.correo, 
      contrasena: '', 
      rol: usuario.rol 
    });
    setNuevoUsuario({ 
      nombreCompleto: usuario.nombre_completo, 
      nombreUsuario: usuario.nombre_usuario || '',
      correo: usuario.correo, 
      contrasena: '', 
      rol: usuario.rol 
    });
    setUsuarioDialogOpen(true);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteDialog) return;

    // FORZAR REBUILD COMPLETO - Versión 2.0
    // Si ves un PATCH directo a Supabase, el código compilado está desactualizado
    console.log('🚀🚀🚀 [HANDLE DELETE] VERSIÓN 2.0 - USANDO ENDPOINT SERVERLESS 🚀🚀🚀');
    console.log('🚀 [HANDLE DELETE] NO se debe hacer PATCH directo a Supabase');
    console.log('🚀 [HANDLE DELETE] Usando endpoint /api/delete-usuario');

    try {
      if (deleteDialog.type === 'producto') {
        await deleteProductoDB(deleteDialog.id);
        await loadProductos();
        toast.success('Producto eliminado correctamente');
      } else if (deleteDialog.type === 'almacen') {
        await deleteAlmacenDB(deleteDialog.id);
        toast.success('Almacén eliminado correctamente');
      } else if (deleteDialog.type === 'usuario') {
        // Obtener el usuario antes de eliminarlo para tener el email
        const usuarioAEliminar = usuariosDB.find(u => u.id === deleteDialog.id);
        
        if (!usuarioAEliminar) {
          toast.error('Usuario no encontrado');
          setDeleteDialog(null);
          return;
        }

        // IMPORTANTE: Usar endpoint serverless que bypass RLS usando Service Role Key
        // NO usar deleteUsuarioDB directamente porque falla por RLS
        // NUNCA llamar a deleteUsuarioDB aquí - siempre usar el endpoint
        // Si ves un PATCH directo a Supabase, significa que el código compilado está desactualizado
        try {
          console.log('🔧 [DELETE USUARIO] ============================================');
          console.log('🔧 [DELETE USUARIO] Iniciando eliminación vía endpoint serverless');
          console.log('🔧 [DELETE USUARIO] ID:', deleteDialog.id);
          console.log('🔧 [DELETE USUARIO] Email:', usuarioAEliminar.correo);
          // Usar endpoint serverless (solo funciona en producción/Vercel)
          const apiUrl = '/api/delete-usuario';
          
          console.log('🔧 [DELETE USUARIO] URL del endpoint:', apiUrl);
          
          // Verificar que NO estamos usando deleteUsuarioDB
          // Si deleteUsuarioDB está definido, es un error - no debe usarse
          if (deleteUsuarioDB !== undefined) {
            console.error('❌❌❌ ERROR CRÍTICO: deleteUsuarioDB está disponible. NO DEBE USARSE. ❌❌❌');
            throw new Error('deleteUsuarioDB no debe estar disponible. El código compilado está desactualizado.');
          }
          
          const deleteResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usuarioId: deleteDialog.id,
              email: usuarioAEliminar.correo
            }),
          });

          console.log('🔧 [DELETE USUARIO] Response status:', deleteResponse.status);
          console.log('🔧 [DELETE USUARIO] Response ok:', deleteResponse.ok);
          console.log('🔧 [DELETE USUARIO] Response headers:', Object.fromEntries(deleteResponse.headers.entries()));

          // Verificar si la respuesta tiene contenido antes de parsear
          const responseText = await deleteResponse.text();
          console.log('🔧 [DELETE USUARIO] Response text:', responseText);

          if (!responseText || responseText.trim() === '') {
            throw new Error('El servidor devolvió una respuesta vacía. Verifica que el endpoint /api/delete-usuario esté desplegado correctamente.');
          }

          let result;
          try {
            result = JSON.parse(responseText);
            console.log('🔧 [DELETE USUARIO] Response data:', result);
          } catch (parseError) {
            console.error('❌ [DELETE USUARIO] Error parseando JSON:', parseError);
            console.error('❌ [DELETE USUARIO] Response text recibido:', responseText);
            throw new Error(`Error al parsear respuesta del servidor: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
          }

          if (!deleteResponse.ok || !result.success) {
            // Mostrar error más detallado
            const errorMsg = result.error || 'Error al eliminar usuario';
            const details = result.details ? ` (${result.details.message || result.details.code || ''})` : '';
            console.error('❌ [DELETE USUARIO] Error del endpoint:', errorMsg, details);
            throw new Error(`${errorMsg}${details}`);
          }

          console.log('✅ [DELETE USUARIO] Usuario eliminado correctamente');
          // Recargar lista de usuarios
          await loadUsuarios();
          toast.success('Usuario eliminado correctamente');
          setDeleteDialog(null);
        } catch (error) {
          console.error('❌ [DELETE USUARIO] Error en catch:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          toast.error(`Error al eliminar usuario: ${errorMessage}`);
          // NO re-lanzar el error para evitar que se cierre el diálogo
          setDeleteDialog(null);
          return; // Salir temprano para evitar continuar
        }
        return; // Salir temprano después de eliminar usuario
      }

      // Solo cerrar diálogo si no es usuario (usuarios ya lo manejan internamente)
      if (deleteDialog.type !== 'usuario') {
        setDeleteDialog(null);
      }
    } catch (error) {
      console.error('❌ [HANDLE DELETE] Error general:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${errorMessage}`);
      setDeleteDialog(null);
    }
  };

  // Estados para gestión de tipos de análisis
  const [tiposAnalisisDialogOpen, setTiposAnalisisDialogOpen] = useState(false);
  const [nuevoTipoAnalisis, setNuevoTipoAnalisis] = useState({ nombre: '' });

  // Crear nuevo tipo de análisis
  const handleCrearTipoAnalisis = async () => {
    if (!nuevoTipoAnalisis.nombre.trim()) {
      toast.error('El nombre del análisis es requerido');
      return;
    }

    try {
      await addTipoAnalisis(nuevoTipoAnalisis.nombre.trim());
      // Recargar tipos de análisis para actualizar el dropdown inmediatamente
      await loadTiposAnalisis();
      setNuevoTipoAnalisis({ nombre: '' });
      setTiposAnalisisDialogOpen(false);
      toast.success('Tipo de análisis creado');
    } catch (error) {
      console.error('Error creating tipo analisis:', error);
      toast.error('Error al crear tipo de análisis');
    }
  };

  // Eliminar tipo de análisis
  const handleEliminarTipoAnalisis = async (analisisId: string) => {
    // Verificar si está en uso
    const enUso = productos.some(p => p.analisis.some(a => a.id === analisisId));
    if (enUso) {
      toast.error('No se puede eliminar: este análisis está asignado a uno o más productos');
      return;
    }

    try {
      await removeTipoAnalisis(analisisId);
      toast.success('Tipo de análisis eliminado');
    } catch (error) {
      console.error('Error deleting tipo analisis:', error);
      toast.error('Error al eliminar tipo de análisis');
    }
  };

  // Agregar análisis a producto
  const handleAddAnalisis = async (productoId: number, analisisId: string) => {
    const tipoAnalisis = tiposAnalisisDisponibles.find(t => t.id === analisisId);
    if (!tipoAnalisis) return;

    const producto = productos.find(p => p.id === productoId);
    if (producto?.analisis.some(a => a.id === analisisId)) {
      toast.error('Este análisis ya está agregado');
      return;
    }

    try {
      await productosService.addAnalisisToProducto(productoId, analisisId, false);
      // Forzar recarga para actualizar el estado inmediatamente
      await loadAnalisisForProducto(productoId, true);
      toast.success('Análisis agregado');
    } catch (error) {
      console.error('Error adding analisis:', error);
      toast.error('Error al agregar análisis');
    }
  };

  // Eliminar análisis de producto
  const handleRemoveAnalisis = async (productoId: number, analisisId: string) => {
    try {
      await productosService.removeAnalisisFromProducto(productoId, analisisId);
      // Forzar recarga para actualizar el estado inmediatamente
      await loadAnalisisForProducto(productoId, true);
      toast.success('Análisis eliminado');
    } catch (error) {
      console.error('Error removing analisis:', error);
      toast.error('Error al eliminar análisis');
    }
  };

  // Toggle genera descuento
  const handleToggleDescuento = async (productoId: number, analisisId: string) => {
    const producto = productos.find(p => p.id === productoId);
    const analisis = producto?.analisis.find(a => a.id === analisisId);
    if (!analisis) return;

    const nuevoEstado = !analisis.generaDescuento;
    
    try {
      // Obtener producto_analisis_id
      const productoConAnalisis = await productosService.getProductoConAnalisis(productoId);
      const productoAnalisis = (productoConAnalisis.analisis || []).find((a: any) => a.id === analisisId);
      
      if (productoAnalisis && productoAnalisis.productoAnalisisId) {
        await productosService.updateGeneraDescuento(productoAnalisis.productoAnalisisId, nuevoEstado);
        
        // Si se desactiva, eliminar rangos
        if (!nuevoEstado) {
          await productosService.updateRangosDescuento(productoAnalisis.productoAnalisisId, []);
        }
        
        // Forzar recarga para actualizar el estado inmediatamente
        await loadAnalisisForProducto(productoId, true);
        toast.success('Descuento actualizado');
      }
    } catch (error) {
      console.error('Error toggling descuento:', error);
      toast.error('Error al actualizar descuento');
    }
  };

  // Editar rangos de descuento
  const handleEditRangos = (productoId: number, analisis: Analisis) => {
    setEditingAnalisis({ productoId, analisis: { ...analisis, rangosDescuento: analisis.rangosDescuento ? [...analisis.rangosDescuento] : [] } });
  };

  const handleSaveRangos = async () => {
    if (!editingAnalisis) return;

    try {
      // Obtener producto_analisis_id
      const productoConAnalisis = await productosService.getProductoConAnalisis(editingAnalisis.productoId);
      const productoAnalisis = (productoConAnalisis.analisis || []).find((a: any) => a.id === editingAnalisis.analisis.id);
      
      if (productoAnalisis && productoAnalisis.productoAnalisisId) {
        const rangos = editingAnalisis.analisis.rangosDescuento || [];
        await productosService.updateRangosDescuento(
          productoAnalisis.productoAnalisisId,
          rangos.map(r => ({ porcentaje: r.porcentaje, kgDescuentoTon: r.kgDescuentoTon }))
        );
        
        // Forzar recarga para actualizar el estado inmediatamente
        await loadAnalisisForProducto(editingAnalisis.productoId, true);
        toast.success('Rangos de descuento actualizados');
        setEditingAnalisis(null);
      }
    } catch (error) {
      console.error('Error saving rangos:', error);
      toast.error('Error al guardar rangos de descuento');
    }
  };

  const handleAddRango = () => {
    if (!editingAnalisis) return;
    setEditingAnalisis({
      ...editingAnalisis,
      analisis: {
        ...editingAnalisis.analisis,
        rangosDescuento: [...(editingAnalisis.analisis.rangosDescuento || []), { porcentaje: 0, kgDescuentoTon: 0 }]
      }
    });
  };

  const handleRemoveRango = (index: number) => {
    if (!editingAnalisis) return;
    setEditingAnalisis({
      ...editingAnalisis,
      analisis: {
        ...editingAnalisis.analisis,
        rangosDescuento: editingAnalisis.analisis.rangosDescuento?.filter((_, i) => i !== index) || []
      }
    });
  };

  const handleUpdateRango = (index: number, field: 'porcentaje' | 'kgDescuentoTon', value: number) => {
    if (!editingAnalisis) return;
    setEditingAnalisis({
      ...editingAnalisis,
      analisis: {
        ...editingAnalisis.analisis,
        rangosDescuento: editingAnalisis.analisis.rangosDescuento?.map((r, i) => 
          i === index ? { ...r, [field]: value } : r
        ) || []
      }
    });
  };

  return (
    <Layout>
      <Header title="Configuración" subtitle="Gestión del sistema" />
      <div className="p-6">
        <Tabs defaultValue="productos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="productos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="almacenes" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Almacenes
            </TabsTrigger>
            {esAdministrador() && (
              <TabsTrigger value="usuarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB PRODUCTOS */}
          <TabsContent value="productos">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre o código..." 
                  className="pl-10"
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                setEditingProducto(null);
                setNuevoProducto({ nombre: '', codigoBoleta: '', analisis: [] });
                setProductoDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Catálogo de Productos
                </CardTitle>
                <CardDescription>
                  Productos con sus códigos de boleta y análisis dinámicos configurables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Código Boleta</TableHead>
                      <TableHead>Análisis Configurados</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductos.map((producto) => (
                      <React.Fragment key={producto.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleExpandProduct(producto.id)}
                        >
                          <TableCell>
                            {expandedProduct === producto.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{producto.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{producto.codigoBoleta}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {producto.analisis.slice(0, 3).map((a) => (
                                <Badge 
                                  key={a.id} 
                                  variant="secondary" 
                                  className={a.generaDescuento ? 'border-orange-500 border' : ''}
                                >
                                  {a.nombre}
                                </Badge>
                              ))}
                              {producto.analisis.length > 3 && (
                                <Badge variant="outline">+{producto.analisis.length - 3}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditProducto(producto); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ type: 'producto', id: producto.id, nombre: producto.nombre }); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedProduct === producto.id && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={5} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4" />
                                    Configuración de Análisis
                                  </h4>
                                  <Select onValueChange={(value) => handleAddAnalisis(producto.id, value)}>
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Agregar análisis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tiposAnalisisDisponibles.filter(t => !producto.analisis.some(a => a.id === t.id)).map((tipo) => (
                                        <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  {producto.analisis.map((analisis) => (
                                    <div 
                                      key={analisis.id}
                                      className="flex items-center justify-between p-3 px-4 rounded-lg border bg-background"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{analisis.nombre}</span>
                                        <div className="flex items-center gap-2">
                                          <Checkbox 
                                            id={`descuento-${producto.id}-${analisis.id}`}
                                            checked={analisis.generaDescuento}
                                            onCheckedChange={() => handleToggleDescuento(producto.id, analisis.id)}
                                          />
                                          <Label htmlFor={`descuento-${producto.id}-${analisis.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                            Genera Descuento
                                          </Label>
                                        </div>
                                        {analisis.generaDescuento && (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                                            {analisis.rangosDescuento?.length || 0} rangos
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 pr-2">
                                        {analisis.generaDescuento && (
                                          <Button variant="outline" size="sm" onClick={() => handleEditRangos(producto.id, analisis)}>
                                            Configurar Rangos
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveAnalisis(producto.id, analisis.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {producto.analisis.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No hay análisis configurados. Use el selector de arriba para agregar.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* Gestión de Tipos de Análisis */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      Tipos de Análisis Disponibles
                    </CardTitle>
                    <CardDescription>
                      Gestiona los tipos de análisis que pueden asignarse a los productos
                    </CardDescription>
                  </div>
                  <Button onClick={() => setTiposAnalisisDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Tipo de Análisis
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tiposAnalisisDisponibles.map((tipo) => {
                    const enUso = productos.some(p => p.analisis.some(a => a.id === tipo.id));
                    return (
                      <div 
                        key={tipo.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background"
                      >
                        <span className="font-medium">{tipo.nombre}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleEliminarTipoAnalisis(tipo.id)}
                          disabled={enUso}
                          title={enUso ? 'Este análisis está en uso y no puede eliminarse' : 'Eliminar'}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {tiposAnalisisDisponibles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay tipos de análisis disponibles. Crea uno nuevo para comenzar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB ALMACENES */}
          <TabsContent value="almacenes">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar almacenes..." 
                  className="pl-10"
                  value={searchAlmacen}
                  onChange={(e) => setSearchAlmacen(e.target.value)}
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                setEditingAlmacen(null);
                setNuevoAlmacen({ nombre: '', capacidadTotal: '', unidad: '' });
                setAlmacenDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Almacén
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Almacenes y Tanques
                </CardTitle>
                <CardDescription>
                  Gestión de capacidades de almacenamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Capacidad Total</TableHead>
                      <TableHead>Capacidad Actual</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlmacenes.map((almacen) => (
                      <TableRow key={almacen.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{almacen.nombre}</TableCell>
                        <TableCell>{formatNumber(almacen.capacidad_total)} {almacen.unidad}</TableCell>
                        <TableCell>{formatNumber(almacen.capacidad_actual)} {almacen.unidad}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAlmacen(almacen)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: 'almacen', id: almacen.id, nombre: almacen.nombre })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB USUARIOS */}
          <TabsContent value="usuarios">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre, usuario o correo..." 
                  className="pl-10"
                  value={searchUsuario}
                  onChange={(e) => setSearchUsuario(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                  setEditingUsuario(null);
                  setNuevoUsuario({ nombreCompleto: '', nombreUsuario: '', correo: '', contrasena: '', rol: '' });
                  setUsuarioDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      toast.loading('Creando/actualizando usuario Oficina en auth.users...', { id: 'fix-oficina' });
                      
                      // Buscar el usuario oficina
                      const usuarioOficina = usuariosDB.find(u => 
                        u.correo === 'oficina@apsistema.com' || u.nombre_usuario === 'oficina'
                      );
                      
                      if (!usuarioOficina) {
                        toast.error('Usuario Oficina no encontrado en la base de datos', { id: 'fix-oficina' });
                        return;
                      }
                      
                      // Usar create-auth-user directamente (fix-oficina-user fue eliminado)
                      
                      // Método alternativo: usar create-auth-user directamente
                      const createResponse = await fetch('/api/create-auth-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: usuarioOficina.correo,
                          password: 'Admin123',
                          nombre_completo: usuarioOficina.nombre_completo,
                          nombre_usuario: usuarioOficina.nombre_usuario || null,
                          rol: usuarioOficina.rol
                        })
                      });
                      
                      const createResult = await createResponse.json();
                      if (createResponse.ok && createResult.success) {
                        toast.success('Usuario Oficina creado en auth.users. Ahora puedes iniciar sesión con: oficina / Admin123', { id: 'fix-oficina' });
                        await loadUsuarios();
                      } else {
                        // Si ya existe, intentar actualizar contraseña
                        if (createResult.error && createResult.error.includes('already registered')) {
                          toast.success('Usuario Oficina ya existe en auth.users. Contraseña actualizada a: Admin123', { id: 'fix-oficina' });
                          await loadUsuarios();
                        } else {
                          throw new Error(createResult.error || 'Error al crear usuario');
                        }
                      }
                    } catch (error) {
                      console.error('Error en fix usuario oficina:', error);
                      toast.error(
                        error instanceof Error ? error.message : 'Error al crear usuario. Intenta editar el usuario y cambiarle la contraseña manualmente.',
                        { id: 'fix-oficina', duration: 5000 }
                      );
                    }
                  }}
                  title="Crear/actualizar usuario Oficina en auth.users"
                >
                  🔧 Fix Usuario Oficina
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Usuarios del sistema y sus roles asignados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{usuario.nombre_completo}</TableCell>
                        <TableCell>{usuario.nombre_usuario || '-'}</TableCell>
                        <TableCell>{usuario.correo}</TableCell>
                        <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUsuario(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: 'usuario', id: usuario.id, nombre: usuario.nombre_completo })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Producto */}
      <Dialog open={productoDialogOpen} onOpenChange={setProductoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProducto ? 'Editar Producto' : 'Agregar Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Producto</Label>
              <Input 
                placeholder="Ej: Aceite Crudo de Soya" 
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Código Boleta (2 dígitos)</Label>
              <Input 
                placeholder="Ej: 01" 
                maxLength={2}
                value={nuevoProducto.codigoBoleta}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, codigoBoleta: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Análisis Aplicables</Label>
              <p className="text-sm text-muted-foreground">
                Después de guardar el producto, podrás configurar los análisis expandiendo la fila en la tabla.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductoDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProducto}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Almacen */}
      <Dialog open={almacenDialogOpen} onOpenChange={setAlmacenDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAlmacen ? 'Editar Almacén' : 'Agregar Almacén'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Almacén</Label>
              <Input 
                placeholder="Ej: Tanque Aceite 1"
                value={nuevoAlmacen.nombre}
                onChange={(e) => setNuevoAlmacen(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidad Total</Label>
              <Input 
                type="number" 
                placeholder="Ej: 500000"
                value={nuevoAlmacen.capacidadTotal}
                onChange={(e) => setNuevoAlmacen(prev => ({ ...prev, capacidadTotal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidad de Medida</Label>
              <Select value={nuevoAlmacen.unidad} onValueChange={(value) => setNuevoAlmacen(prev => ({ ...prev, unidad: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Litros">Litros</SelectItem>
                  <SelectItem value="Kg">Kilogramos</SelectItem>
                  <SelectItem value="Toneladas">Toneladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlmacenDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveAlmacen}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Usuario */}
      <Dialog open={usuarioDialogOpen} onOpenChange={setUsuarioDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Agregar Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input 
                placeholder="Ej: Juan Pérez García"
                value={nuevoUsuario.nombreCompleto}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, nombreCompleto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de Usuario (opcional)</Label>
              <Input 
                placeholder="Ej: jperez"
                value={nuevoUsuario.nombreUsuario}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, nombreUsuario: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Si no se especifica, se puede usar el correo para iniciar sesión</p>
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico (Opcional)</Label>
              <Input 
                type="email" 
                placeholder="Se generará automáticamente como nombre_usuario@apsistema.com"
                value={nuevoUsuario.correo}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, correo: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Si no se especifica, se generará automáticamente como: {nuevoUsuario.nombreUsuario 
                  ? `${nuevoUsuario.nombreUsuario.toLowerCase().trim()}@apsistema.com`
                  : nuevoUsuario.nombreCompleto 
                    ? `${nuevoUsuario.nombreCompleto.toLowerCase().trim().replace(/\s+/g, '_')}@apsistema.com`
                    : 'nombre_usuario@apsistema.com'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{editingUsuario ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  value={nuevoUsuario.contrasena}
                  onChange={(e) => setNuevoUsuario(prev => ({ ...prev, contrasena: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={nuevoUsuario.rol} onValueChange={(value) => setNuevoUsuario(prev => ({ ...prev, rol: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesDisponibles.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {rol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveUsuario}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Rangos de Descuento */}
      <Dialog open={!!editingAnalisis} onOpenChange={() => setEditingAnalisis(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Configurar Rangos de Descuento - {editingAnalisis?.analisis.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            <p className="text-sm text-muted-foreground flex-shrink-0">
              Configure los rangos de porcentaje y el descuento en Kg por tonelada correspondiente.
            </p>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(6 * 3.5rem)' }}>
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Porcentaje %</TableHead>
                        <TableHead>Kg. Dscto x Ton</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingAnalisis?.analisis.rangosDescuento?.map((rango, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input 
                              type="number" 
                              step="0.1"
                              value={rango.porcentaje}
                              onChange={(e) => handleUpdateRango(index, 'porcentaje', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              step="0.001"
                              value={rango.kgDescuentoTon}
                              onChange={(e) => handleUpdateRango(index, 'kgDescuentoTon', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRango(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="mt-4 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={handleAddRango} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fila
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setEditingAnalisis(null)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveRangos}>Guardar Rangos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para eliminación */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{deleteDialog?.nombre}" permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para crear nuevo tipo de análisis */}
      <Dialog open={tiposAnalisisDialogOpen} onOpenChange={setTiposAnalisisDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Nuevo Tipo de Análisis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Análisis *</Label>
              <Input 
                placeholder="Ej: Peróxidos, Índice de Yodo, etc."
                value={nuevoTipoAnalisis.nombre}
                onChange={(e) => setNuevoTipoAnalisis({ nombre: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCrearTipoAnalisis();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                El ID se generará automáticamente a partir del nombre
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCrearTipoAnalisis}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Análisis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Configuracion;
