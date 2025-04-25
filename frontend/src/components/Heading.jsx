import React from 'react';
import { motion } from 'framer-motion';

function Heading({ 
  children, 
  level = 1,
  className = '',
  animate = true,
  color = 'default'
}) {
  const baseStyles = "font-bold tracking-tight";
  
  const levels = {
    1: "text-4xl sm:text-5xl",
    2: "text-3xl sm:text-4xl",
    3: "text-2xl sm:text-3xl",
    4: "text-xl sm:text-2xl",
    5: "text-lg sm:text-xl",
    6: "text-base sm:text-lg"
  };

  const colors = {
    default: "text-gray-900",
    primary: "text-indigo-600",
    secondary: "text-gray-600",
    white: "text-white"
  };

  const HeadingTag = `h${level}`;
  const Wrapper = animate ? motion.div : 'div';

  return (
    <Wrapper
      initial={animate ? { opacity: 0, y: -20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3 }}
    >
      <HeadingTag className={`
        ${baseStyles}
        ${levels[level]}
        ${colors[color]}
        ${className}
      `}>
        {children}
      </HeadingTag>
    </Wrapper>
  );
}

export default Heading; 