import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SafetyButton from '@/components/SafetyButton';
import CheckInTimer from '@/components/CheckInTimer';
import FakeCallButton from '@/components/FakeCallButton';
import SafeWalk from '@/components/SafeWalk';
import { useSafety } from '@/contexts/SafetyContext';
import { Bell, MapPin, Mic, Navigation, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const { isActive, isRecording, recordingDuration, isSafeWalkActive, safeWalkRemainingTime, safeWalkDestination, distanceMeters, stepCount } = useSafety();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full safety-gradient animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Sentri</h1>
            <p className="text-sm text-muted-foreground">Your safety companion</p>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 bg-success/10 px-4 py-2 rounded-full border border-success/20">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-success">Protected</span>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <SafetyButton />
        </div>

        {/* Status Cards - Only show when active */}
        {isActive && (
          <div className="px-6 pb-4 slide-up">
            <Card className="glass-card border-success/20">
              <CardContent className="p-4 space-y-3">
                {isRecording && (
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-destructive recording-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Recording Audio</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(recordingDuration)} captured
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-destructive rounded-full recording-pulse" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-success/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Location Tracked</p>
                    <p className="text-xs text-muted-foreground">Your location is being logged</p>
                  </div>
                  <div className="w-2 h-2 bg-success rounded-full" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Footprints className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Movement</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistance(distanceMeters)} • {stepCount.toLocaleString()} steps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">

                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Contacts Alerted</p>
                    <p className="text-xs text-muted-foreground">Your trusted contacts have been notified</p>
                  </div>
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Safe Walk Status */}
        {isSafeWalkActive && (
          <div className="px-6 pb-4 slide-up">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Safe Walk Active</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {safeWalkDestination} • {formatDuration(safeWalkRemainingTime)} remaining
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-6 pb-6 space-y-3">
          <SafeWalk />
          <CheckInTimer />
          <FakeCallButton />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
