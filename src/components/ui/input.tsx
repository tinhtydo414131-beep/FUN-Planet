import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl",
          "bg-white/40 backdrop-blur-sm",
          "border border-white/50",
          "px-3 py-2 text-base md:text-sm",
          "placeholder:text-gray-400",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-pink-300/60 focus:bg-white/60",
          "transition-all duration-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
