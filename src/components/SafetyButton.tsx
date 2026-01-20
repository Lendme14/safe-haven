import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={handlePress}
        disabled={isLoading}
        className={cn(
          "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95",
          isActive 
            ? "safety-active-gradient pulse-active shadow-2xl" 
            : "safety-gradient pulse-safety shadow-xl hover:shadow-2xl hover:scale-105",
          isLoading && "opacity-75 cursor-not-allowed"
        )}
        aria-label={isActive ? "Deactivate Safety Mode" : "Activate Safety Mode"}
      >
        <div className="absolute inset-2 rounded-full bg-background/10 backdrop-blur-sm" />
        
        {isActive ? (
          <ShieldCheck className="w-20 h-20 text-safety-active-foreground relative z-10" />
        ) : (
          <Shield className="w-20 h-20 text-safety-foreground relative z-10" />
        )}
      </button>

      <div className="text-center">
        <h2 className={cn(
          "text-2xl font-semibold mb-2",
          isActive ? "text-success" : "text-foreground"
        )}>
          {isLoading 
            ? "Please wait..." 
            : isActive 
              ? "You're Protected" 
              : "Tap to Activate"
          }
        </h2>
        <p className="text-muted-foreground text-sm max-w-[200px]">
          {isActive 
            ? "Safety Mode is active. Tap again when you're safe."
            : "Instantly alert your trusted contacts"
          }
        </p>
      </div>
    </div>
  );
};

export default SafetyButton;
