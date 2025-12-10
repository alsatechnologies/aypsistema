
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, PackageSearch, Truck, ArrowUpDown, Users, FileBarChart, LogIn, ClipboardCheck, FlaskConical, Settings, LogOut } from 'lucide-react';
import Logo from './Logo';

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
  
  const navItems = [
    {
      icon: Building2,
      label: 'Oficina',
      path: '/oficina'
    },
    {
      icon: PackageSearch,
      label: 'Reciba',
      path: '/reciba'
    }, 
    {
      icon: Truck,
      label: 'Embarque',
      path: '/embarque'
    }, 
    {
      icon: ArrowUpDown,
      label: 'Movimientos',
      path: '/movimientos'
    }, 
    {
      icon: Users,
      label: 'Proveedores',
      path: '/proveedores'
    }, 
    {
      icon: Users,
      label: 'Clientes',
      path: '/clientes'
    }, 
    {
      icon: FileBarChart,
      label: 'Reportes',
      path: '/reportes'
    },
    {
      icon: LogIn,
      label: 'Ingreso',
      path: '/ingreso'
    },
    {
      icon: ClipboardCheck,
      label: 'Control de Calidad',
      path: '/control-calidad'
    },
    {
      icon: FlaskConical,
      label: 'Laboratorio',
      path: '/laboratorio'
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/configuracion'
    }
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen flex flex-col border-r bg-background">
      <div className="flex items-center p-4 border-b h-16">
        <Logo />
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
