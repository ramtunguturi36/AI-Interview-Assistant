import React from 'react';
import { motion } from 'framer-motion';

export default function Text({ 
  children, 
  size = 'base',
  weight = 'normal',
  color = 'default',
  className = '',
  animate = true,
  as = 'p'
}) {
  const baseStyles = "leading-relaxed";
  
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  const weights = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  };

  const colors = {
    default: "text-gray-900",
    secondary: "text-gray-600",
    primary: "text-indigo-600",
    white: "text-white",
    success: "text-green-600",
    danger: "text-red-600",
    warning: "text-yellow-600"
  };

  const Wrapper = animate ? motion.div : 'div';
  const Component = as;

  return (
    <Wrapper
      initial={animate ? { opacity: 0 } : undefined}
      animate={animate ? { opacity: 1 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Component className={`
        ${baseStyles}
        ${sizes[size]}
        ${weights[weight]}
        ${colors[color]}
        ${className}
      `}>
        {children}
      </Component>
    </Wrapper>
  );
}