import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground shadow-[0_4px_12px_hsla(262,100%,64%,0.3),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_hsla(262,100%,64%,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:brightness-110 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        destructive: "bg-gradient-to-br from-destructive via-destructive to-red-600 text-destructive-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.2)] hover:brightness-110 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        outline: "border-2 border-primary-light bg-gradient-to-br from-card/95 via-card to-muted/50 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.1)] hover:border-primary hover:shadow-[0_4px_12px_hsla(262,100%,64%,0.2),inset_0_1px_0_rgba(255,255,255,0.5)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        secondary: "bg-gradient-to-br from-secondary via-accent to-secondary text-secondary-foreground shadow-[0_4px_12px_hsla(186,100%,50%,0.3),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_hsla(186,100%,50%,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:brightness-110 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        ghost: "hover:bg-gradient-to-br hover:from-muted/80 hover:via-muted hover:to-muted/60 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
