
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColorButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  colors?: string[];
  interval?: number;
  children: React.ReactNode;
  animationStyle?: 'fade' | 'rotate' | 'pulse';
}

export function ColorButton({ 
  colors = ["bg-primary", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500"], 
  interval = 3000, 
  className,
  children,
  animationStyle = 'fade',
  ...props 
}: ColorButtonProps) {
  const [colorIndex, setColorIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [colors.length, interval]);

  const getAnimationClass = () => {
    switch(animationStyle) {
      case 'rotate':
        return 'hover:rotate-3 transition-transform';
      case 'pulse':
        return 'hover:animate-pulse';
      case 'fade':
      default:
        return 'transition-colors duration-1000';
    }
  };

  return (
    <Button
      variant="default"
      className={cn(
        getAnimationClass(),
        colors[colorIndex],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
