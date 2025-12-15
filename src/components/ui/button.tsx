import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { ButtonParticles } from "./button-particles";
import { ButtonFacets } from "./button-facets";
import { ButtonLightRays } from "./button-light-rays";

// 🎀 FUN PLANET PASTEL CUTE DIAMOND BUTTONS - Kids Gaming 2025
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-lg font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        // 💎 Diamond Pastel Default - Lavender to Pink
        default: "bg-gradient-to-br from-[hsl(280,65%,65%)] via-[hsl(320,60%,70%)] to-[hsl(340,70%,70%)] text-white shadow-md hover:shadow-lg hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]",
        
        // 🌸 Pink Pastel Destructive
        destructive: "bg-gradient-to-br from-[hsl(0,60%,60%)] via-[hsl(350,65%,65%)] to-[hsl(340,70%,70%)] text-white shadow-md hover:shadow-lg hover:brightness-110 hover:scale-[1.02]",
        
        // 🍬 Mint Outline
        outline: "border-2 border-[hsl(280,65%,70%)] bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]",
        
        // 💜 Secondary Lavender + Mint
        secondary: "bg-gradient-to-br from-[hsl(200,70%,65%)] via-[hsl(180,55%,65%)] to-[hsl(160,55%,65%)] text-white shadow-md hover:shadow-lg hover:brightness-110 hover:scale-[1.02]",
        
        // 👻 Ghost Pastel
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        
        // 🔗 Link
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-base",
        lg: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 🎵 Play 528Hz bling sound
const playBlingSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(528, audioContext.currentTime); // 528Hz healing frequency
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// 📳 Trigger haptic vibration on mobile
const triggerVibration = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableEffects?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, enableEffects = false, onClick, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const Comp = asChild ? Slot : "button";
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableEffects) {
        playBlingSound();
        triggerVibration();
      }
      onClick?.(e);
    };
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        {...props}
      >
        {enableEffects && (
          <>
            <ButtonFacets />
            <ButtonLightRays isHovered={isHovered} />
            <ButtonParticles isHovered={isHovered} />
          </>
        )}
        <span className="relative z-10">{props.children}</span>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
