import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SafetyButton from '@/components/SafetyButton';
import CheckInTimer from '@/components/CheckInTimer';
import FakeCallButton from '@/components/FakeCallButton';
import { useSafety } from '@/contexts/SafetyContext';
import { Bell, MapPin } from 'lucide-react';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const { isActive } = useSafety();

  if (loading) {
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
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Sentri</h1>
            <p className="text-sm text-muted-foreground">Stay safe, stay calm</p>
          </div>
          {isActive && (
            <div className="flex items-center gap-2 bg-success/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-medium text-success">Protected</span>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
          <SafetyButton />
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-4 space-y-3">
          <CheckInTimer />
          <FakeCallButton />
        </div>

        {/* Status Indicators */}
        {isActive && (
          <div className="px-6 pb-6">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Location Tracked</p>
                  <p className="text-xs text-muted-foreground">Your location is being logged</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Contacts Alerted</p>
                  <p className="text-xs text-muted-foreground">Your trusted contacts have been notified</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
