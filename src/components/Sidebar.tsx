
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, PackageSearch, Truck, ArrowUpDown, Users, FileBarChart, LogIn, ClipboardCheck, FlaskConical, Settings, LogOut } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';

const NavItem = ({
  icon: Icon,
  label,
  to,
  active
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  active: boolean;
}) => {
  return (
    <Link to={to} className="w-full">
      <div className={`flex items-center px-4 py-3 mt-1 rounded-lg ${active ? 'text-primary font-medium bg-primary/10' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Icon size={20} className={active ? 'text-primary' : ''} />
        <span className="ml-4">{label}</span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { usuario, tienePermiso, esAdministrador, logout } = useAuth();
  
  const allNavItems = [
    {
      icon: Building2,
      label: 'Oficina',
      path: '/oficina',
      module: 'oficina'
    },
    {
      icon: PackageSearch,
      label: 'Reciba',
      path: '/reciba',
      module: 'reciba'
    }, 
    {
      icon: Truck,
      label: 'Embarque',
      path: '/embarque',
      module: 'embarque'
    }, 
    {
      icon: ArrowUpDown,
      label: 'Movimientos',
      path: '/movimientos',
      module: 'movimientos'
    }, 
    {
      icon: Users,
      label: 'Proveedores',
      path: '/proveedores',
      module: 'proveedores'
    }, 
    {
      icon: Users,
      label: 'Clientes',
      path: '/clientes',
      module: 'clientes'
    }, 
    {
      icon: FileBarChart,
      label: 'Reportes',
      path: '/reportes',
      module: 'reportes'
    },
    {
      icon: LogIn,
      label: 'Ingreso',
      path: '/ingreso',
      module: 'ingreso'
    },
    {
      icon: ClipboardCheck,
      label: 'Control de Calidad',
      path: '/control-calidad',
      module: 'control-calidad'
    },
    {
      icon: FlaskConical,
      label: 'Laboratorio',
      path: '/laboratorio',
      module: 'laboratorio'
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/configuracion',
      module: 'configuracion'
    }
  ];

  // Filtrar items según permisos del usuario
  const navItems = allNavItems.filter(item => {
    if (esAdministrador()) return true;
    return tienePermiso(item.module);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen flex flex-col border-r bg-background">
      <div className="flex items-center justify-center px-4 py-2 border-b h-20">
        <Logo size="medium" centered />
      </div>
      <div className="flex-grow p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem 
            key={item.path} 
            icon={item.icon} 
            label={item.label} 
            to={item.path} 
            active={pathname === item.path || pathname.startsWith(`${item.path}/`)} 
          />
        ))}
      </div>
      <div className="p-4 border-t">
        <button 
          className="flex items-center w-full px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="ml-4">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
