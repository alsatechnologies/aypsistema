
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  const formattedTime = currentDate.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="flex flex-wrap justify-between items-end gap-4 px-6 pt-7 pb-5 border-b bg-card">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12.5px] text-muted-foreground">
          {formattedDate} · {formattedTime}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="h-[17px] w-[17px]" strokeWidth={1.75} />
          ) : (
            <Moon className="h-[17px] w-[17px]" strokeWidth={1.75} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Header;
