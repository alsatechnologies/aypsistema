import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  centered?: boolean;
}

const Logo = ({ size = 'large', centered = false }: LogoProps) => {
  const heightClass = size === 'small' ? 'h-12' : size === 'medium' ? 'h-16' : 'h-28';
  const justifyClass = centered ? 'justify-center' : 'justify-start';
  
  return (
    <div className={`flex items-center ${justifyClass}`}>
      <img 
        src="/lovable-uploads/logo ap 2.0.png" 
        alt="Aceites y Proteínas Logo" 
        className={`${heightClass} w-auto object-contain`}
      />
    </div>
  );
};
export default Logo;