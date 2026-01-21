import React, { useState } from 'react';
import { Lock, Fingerprint, KeyRound, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AppLockSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: {
    pin_code: string | null;
    biometric_enabled: boolean | null;
  } | null;
  onSettingsUpdated: () => void;
}

const AppLockSetup: React.FC<AppLockSetupProps> = ({
  isOpen,
  onOpenChange,
  currentSettings,
  onSettingsUpdated,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pin' | 'biometric'>('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(currentSettings?.biometric_enabled ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');

  const isPinValid = pin.length >= 4 && pin.length <= 6 && /^\d+$/.test(pin);
  const pinsMatch = pin === confirmPin;

  const handlePinChange = (value: string, isConfirm = false) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    if (isConfirm) {
      setConfirmPin(numericValue);
    } else {
      setPin(numericValue);
    }
  };

  const handleSavePIN = async () => {
    if (!user || !isPinValid || !pinsMatch) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          pin_code: pin,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: "PIN Set",
        description: "Your app lock PIN has been saved.",
      });
      onSettingsUpdated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving PIN:', error);
      toast({
        title: "Error",
        description: "Could not save PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newValue = !biometricEnabled;
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          biometric_enabled: newValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setBiometricEnabled(newValue);
      toast({
        title: newValue ? "Biometric Enabled" : "Biometric Disabled",
        description: newValue 
          ? "You can now unlock with fingerprint or face." 
          : "Biometric unlock has been disabled.",
      });
      onSettingsUpdated();
    } catch (error) {
      console.error('Error toggling biometric:', error);
      toast({
        title: "Error",
        description: "Could not update biometric settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePIN = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          pin_code: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: "PIN Removed",
        description: "App lock PIN has been removed.",
      });
      onSettingsUpdated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error removing PIN:', error);
      toast({
        title: "Error",
        description: "Could not remove PIN.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPin('');
    setConfirmPin('');
    setStep('setup');
  };

  const hasPinSet = !!currentSettings?.pin_code;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            App Lock Setup
          </DialogTitle>
          <DialogDescription>
            Protect your app with PIN or biometric authentication
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pin' | 'biometric')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pin" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              PIN Code
            </TabsTrigger>
            <TabsTrigger value="biometric" className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              Biometric
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pin" className="space-y-4 pt-4">
            {hasPinSet ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-foreground">PIN is set</p>
                      <p className="text-xs text-muted-foreground">Your app is protected</p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleRemovePIN}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove PIN
                </Button>
              </div>
            ) : step === 'setup' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">Enter PIN (4-6 digits)</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {pin.length}/6 digits
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setStep('confirm')}
                  disabled={!isPinValid}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirm PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, true)}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  {confirmPin.length > 0 && !pinsMatch && (
                    <p className="text-xs text-destructive text-center">
                      PINs don't match
                    </p>
                  )}
                  {pinsMatch && confirmPin.length >= 4 && (
                    <p className="text-xs text-success text-center flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> PINs match
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setConfirmPin('');
                      setStep('setup');
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSavePIN}
                    disabled={!pinsMatch || isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save PIN'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="biometric" className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Biometric Unlock</p>
                    <p className="text-xs text-muted-foreground">
                      Use fingerprint or face recognition
                    </p>
                  </div>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={handleToggleBiometric}
                  disabled={isLoading}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Biometric authentication uses your device's security features.
              This works best on native mobile apps.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AppLockSetup;