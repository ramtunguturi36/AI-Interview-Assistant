import React from 'react';
import { motion } from 'framer-motion';

function HoverAnimation({ 
  children, 
  scale = 1.05,
  rotate = 0,
  duration = 0.2,
  className = '',
  whileTap = { scale: 0.95 },
  hoverColor = null
}) {
  const baseAnimation = {
    whileHover: { 
      scale,
      rotate,
      transition: { duration }
    },
    whileTap
  };

  // Add color change on hover if specified
  if (hoverColor) {
    baseAnimation.whileHover.backgroundColor = hoverColor;
  }

  return (
    <motion.div
      className={`inline-block ${className}`}
      {...baseAnimation}
    >
      {children}
    </motion.div>
  );
}

export default HoverAnimation; 