import React from 'react';

export type DecorationShape = 'circle' | 'square' | 'triangle' | 'none';
export type DecorationColor = 'red' | 'blue' | 'yellow';

interface CardProps {
  children: React.ReactNode;
  decoration?: DecorationShape;
  decorationColor?: DecorationColor;
  className?: string;
}

export function Card({ 
  children, 
  decoration = 'circle', 
  decorationColor = 'red',
  className = '' 
}: CardProps) {
  
  const colorMap = {
    red: 'bg-primary-red',
    blue: 'bg-primary-blue',
    yellow: 'bg-primary-yellow'
  };
  
  const renderDecoration = () => {
    if (decoration === 'none') return null;
    
    const baseDecoClass = `absolute top-3 right-3 w-3 h-3 ${colorMap[decorationColor]}`;
    
    switch (decoration) {
      case 'circle':
        return <div className={`${baseDecoClass} rounded-full`} />;
      case 'square':
        return <div className={`${baseDecoClass} rounded-none`} />;
      case 'triangle':
        return (
          <div 
            className={`absolute top-3 right-3 w-3 h-3 ${colorMap[decorationColor]}`}
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative bg-white border-4 border-black shadow-lg p-6 hover:-translate-y-1 transition-transform duration-200 ease-out ${className}`}>
      {renderDecoration()}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
