import React from 'react';
import { motion } from 'framer-motion';

function Card({ 
  children, 
  className = '',
  hover = false,
  onClick,
  padding = 'md'
}) {
  const baseStyles = "bg-white rounded-lg shadow-lg";
  
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const hoverStyles = hover ? "hover:shadow-xl transition-shadow duration-200" : "";
  const cursorStyles = onClick ? "cursor-pointer" : "";

  const CardWrapper = onClick ? motion.div : motion.div;

  return (
    <CardWrapper
      whileHover={hover ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${paddings[padding]}
        ${hoverStyles}
        ${cursorStyles}
        ${className}
      `}
    >
      {children}
    </CardWrapper>
  );
}

export default Card; 