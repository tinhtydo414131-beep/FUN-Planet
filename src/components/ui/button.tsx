import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { ButtonParticles } from "./button-particles";
import { ButtonFacets } from "./button-facets";
import { ButtonLightRays } from "./button-light-rays";

// 🎀 FUN PLANET PASTEL CUTE DIAMOND BUTTONS - Kids Gaming 2025
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-lg font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 relative overflow-hidden before:absolute before:inset-[-4px] before:rounded-2xl before:bg-gradient-to-r before:from-[hsl(340,70%,80%)] before:via-[hsl(280,65%,80%)] before:to-[hsl(200,70%,80%)] before:blur-xl before:opacity-60 before:-z-10 shadow-[0_8px_32px_hsla(280,65%,65%,0.25),0_2px_8px_hsla(340,70%,75%,0.2),0_0_60px_hsla(280,65%,80%,0.15)] hover:shadow-[0_12px_48px_hsla(280,65%,65%,0.4),0_4px_16px_hsla(340,70%,75%,0.3),0_0_80px_hsla(280,65%,85%,0.25)] active:shadow-[0_4px_16px_hsla(280,65%,65%,0.3),0_1px_4px_hsla(340,70%,75%,0.2)]",
  {
    variants: {
      variant: {
        // 💎 Diamond Pastel Default - Lavender to Pink
        default: "bg-gradient-to-br from-[hsl(280,65%,70%)] via-[hsl(320,60%,75%)] to-[hsl(340,70%,75%)] text-white [text-shadow:0_2px_8px_hsla(280,65%,30%,0.5)] shadow-[0_0_30px_hsla(280,65%,70%,0.5),0_0_50px_hsla(340,70%,75%,0.3),0_4px_12px_hsla(280,65%,65%,0.35),inset_0_2px_4px_hsla(0,0%,100%,0.5),inset_0_-2px_6px_hsla(280,50%,50%,0.2)] hover:shadow-[0_0_50px_hsla(280,65%,75%,0.6),0_0_80px_hsla(340,70%,80%,0.4),0_6px_20px_hsla(280,65%,65%,0.45),inset_0_2px_6px_hsla(0,0%,100%,0.6)] hover:brightness-110 hover:scale-[1.03] active:scale-[0.97]",
        
        // 🌸 Pink Pastel Destructive
        destructive: "bg-gradient-to-br from-[hsl(0,60%,65%)] via-[hsl(350,65%,70%)] to-[hsl(340,70%,75%)] text-white [text-shadow:0_2px_8px_hsla(0,60%,30%,0.5)] shadow-[0_0_25px_hsla(0,60%,65%,0.4),0_4px_12px_hsla(350,65%,70%,0.3),inset_0_2px_4px_hsla(0,0%,100%,0.5)] hover:shadow-[0_0_40px_hsla(0,60%,70%,0.5),0_6px_20px_hsla(350,65%,75%,0.4)] hover:brightness-110 hover:scale-[1.03]",
        
        // 🍬 Mint Outline
        outline: "border-3 border-[hsl(280,65%,70%)] bg-gradient-to-br from-[hsl(280,50%,95%)] via-[hsl(320,40%,95%)] to-[hsl(340,50%,95%)] text-[hsl(280,65%,35%)] shadow-[0_0_25px_hsla(280,65%,70%,0.3),0_4px_16px_hsla(340,70%,75%,0.2),inset_0_2px_4px_hsla(0,0%,100%,0.8)] hover:border-[hsl(340,70%,70%)] hover:shadow-[0_0_40px_hsla(280,65%,75%,0.4),0_6px_24px_hsla(340,70%,80%,0.3)] hover:brightness-105 hover:scale-[1.02]",
        
        // 💜 Secondary Lavender + Mint
        secondary: "bg-gradient-to-br from-[hsl(200,70%,70%)] via-[hsl(180,55%,70%)] to-[hsl(160,55%,70%)] text-white [text-shadow:0_2px_8px_hsla(180,55%,30%,0.5)] shadow-[0_0_30px_hsla(200,70%,70%,0.4),0_0_50px_hsla(160,55%,70%,0.3),0_4px_12px_hsla(180,55%,65%,0.35),inset_0_2px_4px_hsla(0,0%,100%,0.5)] hover:shadow-[0_0_50px_hsla(200,70%,75%,0.5),0_0_80px_hsla(160,55%,75%,0.4)] hover:brightness-110 hover:scale-[1.03]",
        
        // 👻 Ghost Pastel
        ghost: "text-foreground hover:bg-gradient-to-br hover:from-[hsl(280,50%,95%)] hover:via-[hsl(320,40%,95%)] hover:to-[hsl(340,50%,95%)] hover:shadow-[0_0_20px_hsla(280,65%,70%,0.2),inset_0_1px_4px_hsla(0,0%,100%,0.5)]",
        
        // 🔗 Link
        link: "text-primary underline-offset-4 hover:underline hover:text-[hsl(280,65%,55%)]",
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
  ({ className, variant, size, asChild = false, enableEffects = true, onClick, ...props }, ref) => {
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
