import React from 'react';
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

const SafetyButton: React.FC = () => {
  const { isActive, activateSafetyMode, deactivateSafetyMode, isLoading } = useSafety();

  const handlePress = async () => {
    if (isLoading) return;
    
    if (isActive) {
      await deactivateSafetyMode();
    } else {
      await activateSafetyMode();
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Main Button */}
      <button
        onClick={handlePress}
        disabled={isLoading}
        className={cn(
          "relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 transform active:scale-95",
          isActive 
            ? "safety-active-gradient pulse-active" 
            : "safety-gradient pulse-safety hover:scale-105",
          isLoading && "opacity-80 cursor-not-allowed",
          "shadow-2xl"
        )}
        style={{
          boxShadow: isActive 
            ? '0 20px 60px -15px hsl(152 76% 40% / 0.5), 0 0 0 1px hsl(152 76% 40% / 0.2)' 
            : '0 20px 60px -15px hsl(220 90% 56% / 0.5), 0 0 0 1px hsl(220 90% 56% / 0.2)'
        }}
        aria-label={isActive ? "Deactivate Safety Mode" : "Activate Safety Mode"}
      >
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          isActive ? "bg-success/20" : "bg-primary/20",
          "animate-ping opacity-20"
        )} />
        
        {/* Inner ring */}
        <div className="absolute inset-3 rounded-full bg-background/10 backdrop-blur-sm" />
        
        {/* Icon */}
        {isLoading ? (
          <Loader2 className="w-16 h-16 text-white relative z-10 animate-spin" />
        ) : isActive ? (
          <ShieldCheck className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
        ) : (
          <Shield className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
        )}
      </button>

      {/* Status Text */}
      <div className="text-center space-y-2">
        <h2 className={cn(
          "text-2xl font-display font-bold tracking-tight",
          isActive ? "text-success" : "text-foreground"
        )}>
          {isLoading 
            ? "Please wait..." 
            : isActive 
              ? "You're Protected" 
              : "Tap to Activate"
          }
        </h2>
        <p className="text-muted-foreground text-sm max-w-[220px] leading-relaxed">
          {isActive 
            ? "Safety Mode is active. Your location and audio are being recorded."
            : "Instantly alert your trusted contacts and start recording"
          }
        </p>
      </div>
    </div>
  );
};

export default SafetyButton;
