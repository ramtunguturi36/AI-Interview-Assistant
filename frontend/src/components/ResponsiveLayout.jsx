import React from 'react';

function ResponsiveLayout({ 
  children, 
  className = '',
  maxWidth = '7xl',
  padding = true,
  centered = true
}) {
  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '3xl': 'max-w-[1400px]',
    '4xl': 'max-w-[1600px]',
    '5xl': 'max-w-[1800px]',
    '6xl': 'max-w-[2000px]',
    '7xl': 'max-w-[2400px]',
    full: 'max-w-full'
  };

  const paddingClasses = padding 
    ? 'px-4 sm:px-6 lg:px-8' 
    : '';

  const centeredClasses = centered 
    ? 'mx-auto' 
    : '';

  return (
    <div className={`
      ${maxWidths[maxWidth]}
      ${paddingClasses}
      ${centeredClasses}
      ${className}
    `}>
      {children}
    </div>
  );
}

export default ResponsiveLayout; 