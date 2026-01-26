import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Smartphone, CheckCircle2, Shield, Wifi, Bell } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Shield, title: 'Emergency Alerts', description: 'One-tap emergency activation' },
    { icon: Wifi, title: 'Works Offline', description: 'Core features available without internet' },
    { icon: Bell, title: 'Push Notifications', description: 'Real-time safety alerts' },
    { icon: Smartphone, title: 'Native Experience', description: 'Feels like a native app' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center pt-8 pb-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Install Sentri</h1>
            <p className="text-muted-foreground mt-2">
              Add Sentri to your home screen for the best experience
            </p>
          </div>

          {/* Install Status Card */}
          <Card className="glass-card border-border/50">
            <CardContent className="pt-6">
              {isInstalled ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Already Installed!</h3>
                    <p className="text-sm text-muted-foreground">
                      Sentri is installed on your device
                    </p>
                  </div>
                </div>
              ) : isIOS ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground text-center">
                    Install on iPhone/iPad
                  </h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">1</span>
                      <span>Tap the <Share2 className="w-4 h-4 inline mx-1" /> Share button in Safari</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">2</span>
                      <span>Scroll down and tap "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">3</span>
                      <span>Tap "Add" in the top right corner</span>
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <div className="space-y-4 text-center">
                  <h3 className="font-semibold text-foreground">Ready to Install</h3>
                  <p className="text-sm text-muted-foreground">
                    Click below to add Sentri to your home screen
                  </p>
                  <Button 
                    onClick={handleInstallClick} 
                    className="w-full bg-gradient-to-r from-primary to-accent"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install Sentri
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground text-center">
                    Install from Browser Menu
                  </h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">1</span>
                      <span>Open your browser's menu (⋮ or ⋯)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">2</span>
                      <span>Look for "Install app" or "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">3</span>
                      <span>Confirm the installation</span>
                    </li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Why Install?</CardTitle>
              <CardDescription>Benefits of installing Sentri</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature.title} className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Install;
