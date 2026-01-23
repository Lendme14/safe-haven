import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Crown, LogOut, ChevronRight, Heart, Moon, Sun, Cloud, Bell, Globe, Shield, Info } from 'lucide-react';
import AppLockSetup from '@/components/AppLockSetup';
import ThemeToggle from '@/components/ThemeToggle';
import { usePremium } from '@/hooks/usePremium';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import { useTheme } from '@/hooks/useTheme';
import { Switch } from '@/components/ui/switch';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emergency_notes: string | null;
  is_premium: boolean;
}

interface AppSettings {
  pin_code: string | null;
  biometric_enabled: boolean | null;
  auto_backup: boolean | null;
}

const Settings: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { isPremium, hasCloudBackup, refetch } = usePremium();
  const { isDark, toggleTheme, theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const [isAppLockOpen, setIsAppLockOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState({ display_name: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emergencyInfo, setEmergencyInfo] = useState({
    blood_type: '',
    allergies: '',
    medical_conditions: '',
    emergency_notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAppSettings();
    }
  }, [user]);

  const fetchAppSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('pin_code, biometric_enabled, auto_backup')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!error && data) {
      setAppSettings(data);
    }
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
      setEditProfile({ display_name: data.display_name || '' });
      setEmergencyInfo({
        blood_type: data.blood_type || '',
        allergies: data.allergies || '',
        medical_conditions: data.medical_conditions || '',
        emergency_notes: data.emergency_notes || '',
      });
    }
    setIsLoading(false);
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: editProfile.display_name })
      .eq('user_id', user!.id);

    if (error) {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      setIsProfileDialogOpen(false);
      fetchProfile();
    }
  };

  const updateEmergencyInfo = async () => {
    const { error } = await supabase.from('profiles').update(emergencyInfo).eq('user_id', user!.id);

    if (error) {
      toast({ title: "Error", description: "Could not update emergency info.", variant: "destructive" });
    } else {
      toast({ title: "Emergency info updated", description: "Your emergency information has been saved." });
      setIsEmergencyDialogOpen(false);
      fetchProfile();
    }
  };

  const toggleAutoBackup = async () => {
    if (!hasCloudBackup) {
      setIsPremiumModalOpen(true);
      return;
    }
    const newValue = !appSettings?.auto_backup;
    const { error } = await supabase.from('app_settings').update({ auto_backup: newValue }).eq('user_id', user!.id);
    if (!error) {
      setAppSettings(prev => prev ? { ...prev, auto_backup: newValue } : null);
      toast({
        title: newValue ? "Auto-backup enabled" : "Auto-backup disabled",
        description: newValue ? "Recordings will be backed up to cloud." : "Recordings will be stored locally only.",
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your account</p>
          </div>
          <ThemeToggle />
        </header>

        {/* Profile Section */}
        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{profile?.display_name || 'Set your name'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input value={editProfile.display_name} onChange={(e) => setEditProfile({ display_name: e.target.value })} placeholder="Your name" />
                  </div>
                  <Button onClick={updateProfile} className="w-full">Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEmergencyDialogOpen} onOpenChange={setIsEmergencyDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Emergency Info</p>
                      <p className="text-xs text-muted-foreground">Medical details for responders</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Emergency Information</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input value={emergencyInfo.blood_type} onChange={(e) => setEmergencyInfo({ ...emergencyInfo, blood_type: e.target.value })} placeholder="Blood Type (e.g., O+)" />
                  <Input value={emergencyInfo.allergies} onChange={(e) => setEmergencyInfo({ ...emergencyInfo, allergies: e.target.value })} placeholder="Allergies" />
                  <Input value={emergencyInfo.medical_conditions} onChange={(e) => setEmergencyInfo({ ...emergencyInfo, medical_conditions: e.target.value })} placeholder="Medical Conditions" />
                  <Input value={emergencyInfo.emergency_notes} onChange={(e) => setEmergencyInfo({ ...emergencyInfo, emergency_notes: e.target.value })} placeholder="Additional Notes" />
                  <Button onClick={updateEmergencyInfo} className="w-full">Save Emergency Info</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Premium Section */}
        <Card className="premium-gradient border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{isPremium ? 'Premium Active' : 'Upgrade to Premium'}</p>
                  <p className="text-xs opacity-80">{isPremium ? 'All features unlocked' : 'Unlock all safety features'}</p>
                </div>
              </div>
              {!isPremium && <Button size="sm" variant="secondary" onClick={() => setIsPremiumModalOpen(true)}>Upgrade</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </div>
                <div><p className="font-medium text-foreground">Notifications</p><p className="text-xs text-muted-foreground">Push notifications</p></div>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50" onClick={toggleTheme}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
                  {isDark ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="text-left"><p className="font-medium text-foreground">Theme</p><p className="text-xs text-muted-foreground capitalize">{theme} mode</p></div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Security & Backup</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50" onClick={() => setIsAppLockOpen(true)}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center"><Lock className="w-5 h-5 text-muted-foreground" /></div>
                <div className="text-left"><p className="font-medium text-foreground">App Lock</p><p className="text-xs text-muted-foreground">{appSettings?.pin_code ? 'PIN enabled' : 'Not configured'}</p></div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50" onClick={toggleAutoBackup}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center"><Cloud className="w-5 h-5 text-muted-foreground" /></div>
                <div className="text-left"><p className="font-medium text-foreground">Cloud Backup</p><p className="text-xs text-muted-foreground">{hasCloudBackup ? (appSettings?.auto_backup ? 'Enabled' : 'Disabled') : 'Premium feature'}</p></div>
              </div>
              {!hasCloudBackup && <Crown className="w-4 h-4 text-warning" />}
            </button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">About</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
              <div><p className="font-medium text-foreground">Sentri</p><p className="text-xs text-muted-foreground">Version 1.0.0 • Your safety companion</p></div>
            </div>
          </CardContent>
        </Card>

        <AppLockSetup isOpen={isAppLockOpen} onOpenChange={setIsAppLockOpen} currentSettings={appSettings} onSettingsUpdated={fetchAppSettings} />
        <PremiumUpgradeModal isOpen={isPremiumModalOpen} onOpenChange={(open) => { setIsPremiumModalOpen(open); if (!open) { refetch(); fetchProfile(); }}} />

        <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;
