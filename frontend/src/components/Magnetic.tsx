import React, { useRef, useState, ReactNode } from 'react';
import { motion, useSpring } from 'framer-motion';

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string; // useful for nested classes
}

export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.3, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const smoothOptions = { damping: 15, stiffness: 150, mass: 0.1 };
  const smoothX = useSpring(position.x, smoothOptions);
  const smoothY = useSpring(position.y, smoothOptions);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        x: smoothX,
        y: smoothY,
        display: 'inline-block'
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};
