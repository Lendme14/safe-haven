import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, Shield, CheckCircle, ChevronRight, Download, Crown, Mic, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePremium } from '@/hooks/usePremium';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import { toast } from '@/hooks/use-toast';

interface SafetyEvent {
  id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  notes: string | null;
}

interface LocationLog {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

interface Recording {
  id: string;
  file_url: string;
  duration_seconds: number | null;
  created_at: string;
}

const Timeline: React.FC = () => {
  const { user, loading } = useAuth();
  const { isPremium, hasTimelineExport, refetch } = usePremium();
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
  const [eventLocations, setEventLocations] = useState<LocationLog[]>([]);
  const [eventRecordings, setEventRecordings] = useState<Recording[]>([]);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('safety_events')
      .select('*')
      .eq('user_id', user!.id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  };

  const fetchEventDetails = async (eventId: string) => {
    const [locationsRes, recordingsRes] = await Promise.all([
      supabase
        .from('location_logs')
        .select('*')
        .eq('safety_event_id', eventId)
        .eq('user_id', user!.id)
        .order('recorded_at', { ascending: true }),
      supabase
        .from('recordings')
        .select('*')
        .eq('safety_event_id', eventId)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true }),
    ]);

    if (locationsRes.error) console.error('Error fetching locations:', locationsRes.error);
    if (recordingsRes.error) console.error('Error fetching recordings:', recordingsRes.error);

    setEventLocations(locationsRes.data || []);
    setEventRecordings(recordingsRes.data || []);
  };

  const handleEventClick = (event: SafetyEvent) => {
    setSelectedEvent(event);
    fetchEventDetails(event.id);
  };

  const handleExportTimeline = () => {
    if (!hasTimelineExport) {
      setIsPremiumModalOpen(true);
      return;
    }

    // Export as JSON
    const exportData = events.map(e => ({
      id: e.id,
      started: e.started_at,
      ended: e.ended_at,
      notes: e.notes,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentri-timeline-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Timeline Exported",
      description: "Your safety timeline has been downloaded.",
    });
  };

  const haversineMeters = (a: LocationLog, b: LocationLog) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const journeyMeters = eventLocations.reduce((total, loc, i) => {
    if (i === 0) return 0;
    const d = haversineMeters(eventLocations[i - 1], loc);
    return d >= 5 && d < 1000 ? total + d : total;
  }, 0);

  const journeySteps = Math.round(journeyMeters / 0.75);

  const formatDistance = (meters: number) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;

  const calculateDuration = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

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
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Safety Timeline</h1>
            <p className="text-muted-foreground mt-1">
              Your safety event history
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportTimeline}
            className="gap-2"
          >
            {hasTimelineExport ? (
              <Download className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Export
            {!hasTimelineExport && <Crown className="w-3 h-3 text-primary" />}
          </Button>
        </header>

        {/* Events List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
          ) : events.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No events yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your safety events will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card 
                key={event.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        event.is_active ? 'bg-success/10' : 'bg-primary/10'
                      }`}>
                        {event.is_active ? (
                          <Shield className="w-6 h-6 text-success" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">
                            {event.is_active ? 'Active Event' : 'Safety Event'}
                          </h3>
                          {event.is_active && (
                            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.started_at), 'MMM d, h:mm a')}
                          </span>
                          <span>•</span>
                          <span>
                            {calculateDuration(event.started_at, event.ended_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium">
                      {format(new Date(selectedEvent.started_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Ended</span>
                    <span className="text-sm font-medium">
                      {selectedEvent.ended_at 
                        ? format(new Date(selectedEvent.ended_at), 'MMM d, yyyy h:mm a')
                        : 'Ongoing'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="text-sm font-medium">
                      {calculateDuration(selectedEvent.started_at, selectedEvent.ended_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`text-sm font-medium ${
                      selectedEvent.is_active ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {selectedEvent.is_active ? 'Active' : 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Recordings */}
                {eventRecordings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Audio Recordings
                    </h4>
                    <div className="space-y-2">
                      {eventRecordings.map((rec) => (
                        <div 
                          key={rec.id}
                          className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-lg"
                        >
                          <Mic className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-foreground">
                            {rec.duration_seconds ? `${rec.duration_seconds}s` : 'Recording'}
                          </span>
                          <span className="text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location History */}
                {eventLocations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location History
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {eventLocations.map((loc) => (
                        <div 
                          key={loc.id}
                          className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-lg"
                        >
                          <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                          </span>
                          <span className="text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(loc.recorded_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <PremiumUpgradeModal 
          isOpen={isPremiumModalOpen} 
          onOpenChange={(open) => {
            setIsPremiumModalOpen(open);
            if (!open) refetch();
          }} 
        />
      </div>
    </Layout>
  );
};

export default Timeline;
