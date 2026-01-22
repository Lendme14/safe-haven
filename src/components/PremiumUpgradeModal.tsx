import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, Users, Cloud, Video, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { upgradeToPremium } = usePremium();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    const success = await upgradeToPremium();
    setIsUpgrading(false);

    if (success) {
      toast({
        title: "Welcome to Premium!",
        description: "All premium features are now unlocked.",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Upgrade failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const features = [
    { icon: Users, text: "Up to 3 trusted contacts" },
    { icon: Cloud, text: "Cloud backup for recordings" },
    { icon: Video, text: "Video recording support" },
    { icon: FileDown, text: "Export timeline history" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Crown className="w-6 h-6 text-primary" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
                <Check className="w-4 h-4 text-success ml-auto" />
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-foreground">$4.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground">Cancel anytime</p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleUpgrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? "Upgrading..." : "Start Premium Trial"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            7-day free trial • No credit card required
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
