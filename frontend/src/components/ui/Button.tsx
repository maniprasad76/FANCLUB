import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'yellow' | 'outline' | 'ghost';
export type ButtonShape = 'square' | 'pill';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  shape?: ButtonShape;
  children: React.ReactNode;
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  shape = 'square', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const shapeStyles = {
    square: "rounded-none",
    pill: "rounded-full"
  };
  
  const variantStyles = {
    primary: "bg-primary-red text-white border-2 border-black shadow-sm hover:bg-primary-red/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    secondary: "bg-primary-blue text-white border-2 border-black shadow-sm hover:bg-primary-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    yellow: "bg-primary-yellow text-black border-2 border-black shadow-sm hover:bg-primary-yellow/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    outline: "bg-white text-black border-2 border-black shadow-sm hover:bg-primary-yellow/10 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    ghost: "border-none text-black hover:bg-gray-200"
  };
  
  return (
    <button 
      className={`${baseStyles} ${shapeStyles[shape]} ${variantStyles[variant]} px-6 py-3 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
