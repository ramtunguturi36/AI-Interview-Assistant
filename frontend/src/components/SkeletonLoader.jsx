import React from 'react';
import { motion } from 'framer-motion';

function SkeletonLoader({ 
  type = 'card',
  count = 1,
  className = '',
  height = 'auto'
}) {
  const types = {
    card: 'rounded-lg',
    text: 'rounded',
    avatar: 'rounded-full',
    button: 'rounded-lg'
  };

  const heights = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
    auto: height
  };

  const shimmerAnimation = {
    initial: { opacity: 0.5 },
    animate: { 
      opacity: [0.5, 0.8, 0.5],
      transition: { 
        duration: 1.5, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Array(count).fill(0).map((_, index) => (
        <motion.div
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 ${types[type]} ${heights[height]}`}
          {...shimmerAnimation}
        />
      ))}
    </div>
  );
}

export default SkeletonLoader; 