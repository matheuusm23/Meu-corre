
import React from 'react';

interface LogoProps {
  variant?: 'default' | 'light';
  showEmoji?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'default', 
  showEmoji = true,
  size = 'md'
}) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900 dark:text-white';
  
  const sizeClasses = {
    xs: 'text-sm',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex items-center gap-2 select-none py-1">
      <h1 className={`${sizeClasses[size]} font-black tracking-tight ${textColor}`}>
        Meu Corre
      </h1>
      {showEmoji && <span className={size === 'xs' ? 'text-sm' : size === 'sm' ? 'text-lg' : 'text-2xl'}>🏍️</span>}
    </div>
  );
};
