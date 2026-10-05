
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, PackageSearch, Truck, ArrowUpDown, Users, FileBarChart, LogIn, ClipboardCheck, FlaskConical, Factory, Settings, LogOut, History, Ship } from 'lucide-react';
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
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }`}
    >
      <Icon size={18} strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { usuario, tienePermiso, esAdministrador, logout } = useAuth();

  const navGroups = [
    {
      label: 'Operación',
      items: [
        { icon: Building2, label: 'Oficina', path: '/oficina', module: 'oficina' },
        { icon: PackageSearch, label: 'Reciba', path: '/reciba', module: 'reciba' },
        { icon: Truck, label: 'Embarque', path: '/embarque', module: 'embarque' },
        { icon: ArrowUpDown, label: 'Movimientos', path: '/movimientos', module: 'movimientos' },
        { icon: Ship, label: 'Exportaciones', path: '/exportaciones', module: 'exportaciones' },
      ]
    },
    {
      label: 'Calidad y planta',
      items: [
        { icon: ClipboardCheck, label: 'Control de Calidad', path: '/control-calidad', module: 'control-calidad' },
        { icon: FlaskConical, label: 'Laboratorio', path: '/laboratorio', module: 'laboratorio' },
        { icon: Factory, label: 'Producción', path: '/produccion', module: 'produccion' },
      ]
    },
    {
      label: 'Catálogos',
      items: [
        { icon: Users, label: 'Proveedores', path: '/proveedores', module: 'proveedores' },
        { icon: Users, label: 'Clientes', path: '/clientes', module: 'clientes' },
        { icon: LogIn, label: 'Ingreso', path: '/ingreso', module: 'ingreso' },
      ]
    },
    {
      label: 'Administración',
      items: [
        { icon: FileBarChart, label: 'Reportes', path: '/reportes', module: 'reportes' },
        { icon: History, label: 'Auditoría', path: '/auditoria', module: 'auditoria' },
        { icon: Settings, label: 'Configuración', path: '/configuracion', module: 'configuracion' },
      ]
    }
  ];

  // Filtrar items según permisos del usuario y ocultar grupos vacíos
  const visibleGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => esAdministrador() || tienePermiso(item.module))
    }))
    .filter(group => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nombre = usuario?.nombre_completo || usuario?.nombre_usuario || 'Usuario';
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

  return (
    <aside className="w-64 h-screen flex flex-col bg-sidebar text-sidebar-foreground px-3.5 py-5 gap-5 shrink-0">
      <div className="flex items-center gap-3 px-2">
        <div className="h-11 w-11 rounded-[10px] bg-white overflow-hidden shrink-0">
          <img
            src="/lovable-uploads/logo ap 2.0.png"
            alt="Aceites y Proteínas"
            className="block max-w-none w-24 h-auto -ml-[26px] mt-[3px]"
          />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-white font-semibold text-sm truncate">Aceites y Proteínas</span>
          <span className="text-xs text-sidebar-muted">Sistema de operación</span>
        </div>
      </div>

      <nav aria-label="Principal" className="flex-grow overflow-y-auto flex flex-col gap-4 -mx-1 px-1">
        {visibleGroups.map(group => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span className="px-3 pb-1.5 text-[11px] uppercase tracking-[0.08em] text-sidebar-muted">
              {group.label}
            </span>
            {group.items.map(item => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                to={item.path}
                active={pathname === item.path || pathname.startsWith(`${item.path}/`)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 px-2 pt-3 border-t border-sidebar-border">
        <div className="h-[34px] w-[34px] rounded-full bg-sidebar-accent text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
          {iniciales || 'U'}
        </div>
        <div className="flex flex-col leading-tight flex-grow min-w-0">
          <span className="text-white text-[13px] font-medium truncate">{nombre}</span>
          <span className="text-xs text-sidebar-muted truncate">{usuario?.rol ?? ''}</span>
        </div>
        <button
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={handleLogout}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
