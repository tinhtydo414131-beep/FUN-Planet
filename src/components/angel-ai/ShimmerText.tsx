import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export const ShimmerText = ({ 
  children, 
  className,
  as: Component = "span" 
}: ShimmerTextProps) => {
  return (
    <Component
      className={cn(
        "bg-gradient-to-r from-white via-pink-200 via-purple-200 to-white bg-clip-text text-transparent",
        "bg-[length:200%_100%] animate-shimmer",
        className
      )}
    >
      {children}
    </Component>
  );
};
