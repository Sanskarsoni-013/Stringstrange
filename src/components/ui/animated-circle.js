import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedCircle = ({ 
  size = 100, 
  strokeWidth = 4, 
  color = 'blue', 
  duration = 2,
  delay = 0,
  className = '',
  ...props 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <svg
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        animate={{ pathLength: 1 }}
        transition={{
          duration: duration,
          delay: delay,
          ease: "easeInOut"
        }}
        style={{
          pathLength: 1,
          transformOrigin: 'center'
        }}
      />
    </svg>
  );
};

export default AnimatedCircle;
