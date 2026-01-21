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
import { User, Lock, Crown, LogOut, ChevronRight, Heart } from 'lucide-react';
import AppLockSetup from '@/components/AppLockSetup';

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
}

const Settings: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const [isAppLockOpen, setIsAppLockOpen] = useState(false);
  const [editProfile, setEditProfile] = useState({ display_name: '' });
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
      .select('pin_code, biometric_enabled')
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
      toast({
        title: "Error",
        description: "Could not update profile.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved.",
      });
      setIsProfileDialogOpen(false);
      fetchProfile();
    }
  };

  const updateEmergencyInfo = async () => {
    const { error } = await supabase
      .from('profiles')
      .update(emergencyInfo)
      .eq('user_id', user!.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update emergency info.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Emergency info updated",
        description: "Your emergency information has been saved.",
      });
      setIsEmergencyDialogOpen(false);
      fetchProfile();
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </header>

        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">
                        {profile?.display_name || 'Set your name'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input
                      value={editProfile.display_name}
                      onChange={(e) => setEditProfile({ display_name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <Button onClick={updateProfile} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEmergencyDialogOpen} onOpenChange={setIsEmergencyDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
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
                <DialogHeader>
                  <DialogTitle>Emergency Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Type</label>
                    <Input
                      value={emergencyInfo.blood_type}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, blood_type: e.target.value })}
                      placeholder="e.g., O+, A-, B+"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Allergies</label>
                    <Input
                      value={emergencyInfo.allergies}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, allergies: e.target.value })}
                      placeholder="e.g., Penicillin, Peanuts"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Medical Conditions</label>
                    <Input
                      value={emergencyInfo.medical_conditions}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, medical_conditions: e.target.value })}
                      placeholder="e.g., Diabetes, Asthma"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <Input
                      value={emergencyInfo.emergency_notes}
                      onChange={(e) => setEmergencyInfo({ ...emergencyInfo, emergency_notes: e.target.value })}
                      placeholder="Any other important information"
                    />
                  </div>
                  <Button onClick={updateEmergencyInfo} className="w-full">
                    Save Emergency Info
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Premium Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {profile?.is_premium ? 'Premium Active' : 'Upgrade to Premium'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.is_premium 
                      ? 'All features unlocked' 
                      : 'Video, cloud backup, 3 contacts'
                    }
                  </p>
                </div>
              </div>
              {!profile?.is_premium && (
                <Button size="sm" variant="default">
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setIsAppLockOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">App Lock</p>
                  <p className="text-xs text-muted-foreground">
                    {appSettings?.pin_code ? 'PIN enabled' : appSettings?.biometric_enabled ? 'Biometric enabled' : 'Not configured'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        <AppLockSetup
          isOpen={isAppLockOpen}
          onOpenChange={setIsAppLockOpen}
          currentSettings={appSettings}
          onSettingsUpdated={fetchAppSettings}
        />

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sentri v1.0.0 • Your safety, your control
        </p>
      </div>
    </Layout>
  );
};

export default Settings;
