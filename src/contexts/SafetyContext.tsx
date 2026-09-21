import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAudioRecording } from '@/hooks/useAudioRecording';

type LatLng = { latitude: number; longitude: number };

type LastLocationLog = {
  atMs: number;
  latitude: number;
  longitude: number;
} | null;

interface SafetyContextType {
  // Safety Mode
  isActive: boolean;
  currentEventId: string | null;
  activateSafetyMode: () => Promise<void>;
  deactivateSafetyMode: () => Promise<void>;
  isLoading: boolean;
  
  // Audio Recording
  isRecording: boolean;
  recordingDuration: number;
  
  // Check-in Timer
  isTimerActive: boolean;
  timerEndTime: Date | null;
  timerDuration: number;
  startCheckInTimer: (minutes: number) => void;
  cancelCheckInTimer: () => void;
  checkIn: () => void;
  remainingTime: number;

  // Safe Walk
  isSafeWalkActive: boolean;
  safeWalkDestination: string | null;
  safeWalkEta: number | null;
  startSafeWalk: (destination: string, etaMinutes: number) => Promise<void>;
  endSafeWalk: () => Promise<void>;
  safeWalkRemainingTime: number;

  // Movement tracking
  distanceMeters: number;
  stepCount: number;
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio recording hook - no longer needs eventId as parameter
  const { 
    isRecording, 
    duration: recordingDuration, 
    startRecording, 
    stopRecording 
  } = useAudioRecording();
  
  // Check-in Timer State
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerEndTime, setTimerEndTime] = useState<Date | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Safe Walk State
  const [isSafeWalkActive, setIsSafeWalkActive] = useState(false);
  const [safeWalkDestination, setSafeWalkDestination] = useState<string | null>(null);
  const [safeWalkEta, setSafeWalkEta] = useState<number | null>(null);
  const [safeWalkRemainingTime, setSafeWalkRemainingTime] = useState(0);
  const [safeWalkEventId, setSafeWalkEventId] = useState<string | null>(null);
  const safeWalkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safeWalkCountdownRef = useRef<NodeJS.Timeout | null>(null);

  // Independent location watches (so Safe Walk and Safety Mode don't stomp each other)
  const safetyLocationWatchRef = useRef<number | null>(null);
  const safeWalkLocationWatchRef = useRef<number | null>(null);

  const lastSafetyLocationLogRef = useRef<LastLocationLog>(null);
  const lastSafeWalkLocationLogRef = useRef<LastLocationLog>(null);

  // Movement tracking (distance covered + estimated steps)
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const lastMovementPosRef = useRef<LatLng | null>(null);
  const AVG_STEP_METERS = 0.75;

  const haversineMeters = (a: LatLng, b: LatLng) => {
    const R = 6371000;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * y;
  };

  const shouldLogLocation = (last: LastLocationLog, next: LatLng, nowMs: number) => {
    // Throttle DB writes while still logging reliably
    const MIN_INTERVAL_MS = 20_000; // at least every 20s
    const MIN_DISTANCE_M = 15; // or every 15m

    if (!last) return true;
    if (nowMs - last.atMs >= MIN_INTERVAL_MS) return true;

    const dist = haversineMeters(
      { latitude: last.latitude, longitude: last.longitude },
      next
    );
    return dist >= MIN_DISTANCE_M;
  };

  // Update remaining time every second
  useEffect(() => {
    if (isTimerActive && timerEndTime) {
      countdownRef.current = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((timerEndTime.getTime() - now.getTime()) / 1000));
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          handleMissedCheckIn();
        }
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [isTimerActive, timerEndTime]);

  // Safe Walk countdown
  useEffect(() => {
    if (isSafeWalkActive && safeWalkEta) {
      const endTime = new Date(Date.now() + safeWalkEta * 60 * 1000);
      
      safeWalkCountdownRef.current = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        setSafeWalkRemainingTime(remaining);
        
        if (remaining <= 0) {
          handleSafeWalkExpired();
        }
      }, 1000);

      return () => {
        if (safeWalkCountdownRef.current) {
          clearInterval(safeWalkCountdownRef.current);
        }
      };
    }
  }, [isSafeWalkActive, safeWalkEta]);

  const handleSafeWalkExpired = useCallback(async () => {
    if (!user) return;
    
    console.log('Safe walk ETA expired - alerting contacts');
    
    try {
      const { error: alertError } = await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: safeWalkEventId,
          alert_type: 'safe_walk_expired',
          user_id: user.id,
          destination: safeWalkDestination,
        },
      });

      if (alertError) {
        console.error('Error sending safe walk alert:', alertError);
      }

      toast({
        title: "ETA Expired",
        description: "Your trusted contacts have been alerted. Are you safe?",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error handling safe walk expiration:', error);
    }
  }, [user, safeWalkEventId, safeWalkDestination]);

  const handleMissedCheckIn = useCallback(async () => {
    if (!user) return;
    
    console.log('Check-in timer expired - alerting contacts');
    
    setIsTimerActive(false);
    setTimerEndTime(null);
    setRemainingTime(0);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const { data: event, error: eventError } = await supabase
        .from('safety_events')
        .insert({
          user_id: user.id,
          is_active: false,
          notes: 'Missed check-in timer',
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (eventError) throw eventError;

      let location: { latitude: number; longitude: number } | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          await supabase.from('location_logs').insert({
            safety_event_id: event.id,
            user_id: user.id,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: position.coords.accuracy,
          });
        } catch (e) {
          console.log('Could not get location:', e);
        }
      }

      const { error: alertError } = await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: event.id,
          alert_type: 'check_in_missed',
          user_id: user.id,
          location,
        },
      });

      if (alertError) {
        console.error('Error sending missed check-in alert:', alertError);
      }

      toast({
        title: "Check-in Missed",
        description: "Your trusted contacts have been alerted.",
        variant: "destructive",
      });

    } catch (error) {
      console.error('Error handling missed check-in:', error);
      toast({
        title: "Error",
        description: "Could not send alerts. Please contact your trusted contacts directly.",
        variant: "destructive",
      });
    }
  }, [user]);

  const captureLocation = useCallback(async (eventId: string) => {
    if (!user || !navigator.geolocation) return null;

    return new Promise<LatLng | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          try {
            const { error } = await supabase.from('location_logs').insert({
              safety_event_id: eventId,
              user_id: user.id,
              latitude,
              longitude,
              accuracy,
            });
            if (error) {
              console.error('Failed to insert initial location log:', error);
            }
          } catch (e) {
            console.error('Unexpected error inserting initial location log:', e);
          }

          resolve({ latitude, longitude });
        },
        (error) => {
          console.log('Location error:', error.message);
          if (error.code === 1) {
            toast({
              title: 'Location permission needed',
              description: 'Enable location access to log your timeline and share your position.',
              variant: 'destructive',
            });
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
    });
  }, [user]);

  const startLocationTracking = useCallback(
    (mode: 'safety' | 'safe_walk', eventId: string) => {
      if (!user || !navigator.geolocation) return;

      const watchRef = mode === 'safety' ? safetyLocationWatchRef : safeWalkLocationWatchRef;
      const lastRef = mode === 'safety' ? lastSafetyLocationLogRef : lastSafeWalkLocationLogRef;

      if (watchRef.current !== null) return;

      watchRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const nowMs = Date.now();
          const next: LatLng = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          if (!shouldLogLocation(lastRef.current, next, nowMs)) return;

          try {
            const { error } = await supabase.from('location_logs').insert({
              safety_event_id: eventId,
              user_id: user.id,
              latitude: next.latitude,
              longitude: next.longitude,
              accuracy: position.coords.accuracy,
            });

            if (error) {
              console.error(`Failed to insert ${mode} location log:`, error);
              return;
            }

            lastRef.current = {
              atMs: nowMs,
              latitude: next.latitude,
              longitude: next.longitude,
            };
          } catch (e) {
            console.error(`Unexpected error inserting ${mode} location log:`, e);
          }
        },
        (error) => {
          console.log(`Location watch error (${mode}):`, error);
          if (error.code === 1) {
            toast({
              title: 'Location permission needed',
              description: 'Enable location access to log your timeline and share your position.',
              variant: 'destructive',
            });
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
      );
    },
    [user]
  );

  const stopLocationTracking = useCallback((mode: 'safety' | 'safe_walk') => {
    const watchRef = mode === 'safety' ? safetyLocationWatchRef : safeWalkLocationWatchRef;
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    if (mode === 'safety') lastSafetyLocationLogRef.current = null;
    if (mode === 'safe_walk') lastSafeWalkLocationLogRef.current = null;
  }, []);

  const activateSafetyMode = useCallback(async () => {
    if (!user || isActive) return;
    
    setIsLoading(true);
    
    try {
      // Create safety event first
      const { data: event, error } = await supabase
        .from('safety_events')
        .insert({
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const eventId = event.id;
      setCurrentEventId(eventId);
      setIsActive(true);

      // Capture initial location
      const location = await captureLocation(eventId);

      // Start continuous tracking (this is what powers Timeline location history)
      startLocationTracking('safety', eventId);

      // Start audio recording with userId and eventId directly
      console.log('Starting audio recording for safety event:', eventId);
      const recordingStarted = await startRecording(user.id, eventId);
      if (recordingStarted) {
        console.log('Audio recording started successfully');
      } else {
        console.log('Audio recording could not start');
      }

      // Send alerts via edge function
      const { error: alertError } = await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: eventId,
          alert_type: 'activation',
          user_id: user.id,
          location,
        },
      });

      if (alertError) {
        console.error('Error sending activation alert:', alertError);
      }

      toast({
        title: "Safety Mode Active",
        description: "Recording audio & tracking location. Contacts alerted.",
      });

    } catch (error) {
      console.error('Error activating safety mode:', error);
      toast({
        title: "Error",
        description: "Could not activate safety mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isActive, captureLocation, startLocationTracking, startRecording]);

  const deactivateSafetyMode = useCallback(async () => {
    if (!user || !isActive || !currentEventId) return;

    setIsLoading(true);

    try {
      // Stop location tracking first to avoid late inserts after ending the event
      stopLocationTracking('safety');

      // Stop audio recording first
      console.log('Stopping audio recording...');
      await stopRecording();

      await supabase
        .from('safety_events')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentEventId);

      // Send deactivation alerts via edge function
      const { error: alertError } = await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: currentEventId,
          alert_type: 'deactivation',
          user_id: user.id,
        },
      });

      if (alertError) {
        console.error('Error sending deactivation alert:', alertError);
      }

      setIsActive(false);
      setCurrentEventId(null);

      toast({
        title: "You're safe now",
        description: "Safety mode deactivated. Recording saved.",
      });

    } catch (error) {
      console.error('Error deactivating safety mode:', error);
      toast({
        title: "Error",
        description: "Could not deactivate safety mode.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isActive, currentEventId, stopLocationTracking, stopRecording]);

  // Safe Walk Functions
  const startSafeWalk = useCallback(async (destination: string, etaMinutes: number) => {
    if (!user || isSafeWalkActive) return;

    try {
      // Create safety event for safe walk
      const { data: event, error } = await supabase
        .from('safety_events')
        .insert({
          user_id: user.id,
          is_active: true,
          notes: `Safe Walk to: ${destination}`,
        })
        .select()
        .single();

      if (error) throw error;

      setSafeWalkEventId(event.id);
      setSafeWalkDestination(destination);
      setSafeWalkEta(etaMinutes);
      setSafeWalkRemainingTime(etaMinutes * 60);
      setIsSafeWalkActive(true);

      // Get initial location
      await captureLocation(event.id);

      // Start continuous location tracking
      startLocationTracking('safe_walk', event.id);

      // Alert contacts about safe walk start
      await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: event.id,
          alert_type: 'safe_walk_started',
          user_id: user.id,
          destination,
          eta_minutes: etaMinutes,
        },
      });

      toast({
        title: "Safe Walk Started",
        description: `Your contacts know you're heading to ${destination}.`,
      });

    } catch (error) {
      console.error('Error starting safe walk:', error);
      toast({
        title: "Error",
        description: "Could not start safe walk.",
        variant: "destructive",
      });
    }
  }, [user, isSafeWalkActive, captureLocation, startLocationTracking]);

  const endSafeWalk = useCallback(async () => {
    if (!user || !isSafeWalkActive || !safeWalkEventId) return;

    try {
      // Stop location watching
      stopLocationTracking('safe_walk');

      // Clear timers
      if (safeWalkTimerRef.current) {
        clearTimeout(safeWalkTimerRef.current);
      }
      if (safeWalkCountdownRef.current) {
        clearInterval(safeWalkCountdownRef.current);
      }

      // Update event
      await supabase
        .from('safety_events')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', safeWalkEventId);

      // Alert contacts
      await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: safeWalkEventId,
          alert_type: 'safe_walk_completed',
          user_id: user.id,
          destination: safeWalkDestination,
        },
      });

      setIsSafeWalkActive(false);
      setSafeWalkDestination(null);
      setSafeWalkEta(null);
      setSafeWalkRemainingTime(0);
      setSafeWalkEventId(null);

      toast({
        title: "Arrived Safely",
        description: "Your contacts have been notified that you arrived.",
      });

    } catch (error) {
      console.error('Error ending safe walk:', error);
    }
  }, [user, isSafeWalkActive, safeWalkEventId, safeWalkDestination, stopLocationTracking]);

  // Check-in Timer Functions
  const startCheckInTimer = useCallback((minutes: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const endTime = new Date(Date.now() + minutes * 60 * 1000);
    setTimerDuration(minutes);
    setTimerEndTime(endTime);
    setRemainingTime(minutes * 60);
    setIsTimerActive(true);

    timerRef.current = setTimeout(() => {
      handleMissedCheckIn();
    }, minutes * 60 * 1000);

    toast({
      title: "Check-in Timer Started",
      description: `You have ${minutes} minutes to check in.`,
    });
  }, [handleMissedCheckIn]);

  const cancelCheckInTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    setIsTimerActive(false);
    setTimerEndTime(null);
    setRemainingTime(0);
    setTimerDuration(0);

    toast({
      title: "Timer Cancelled",
      description: "Check-in timer has been cancelled.",
    });
  }, [stopLocationTracking]);

  const checkIn = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    setIsTimerActive(false);
    setTimerEndTime(null);
    setRemainingTime(0);
    setTimerDuration(0);

    toast({
      title: "Checked In!",
      description: "You're safe. Timer has been reset.",
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (safeWalkTimerRef.current) {
        clearTimeout(safeWalkTimerRef.current);
      }
      if (safeWalkCountdownRef.current) {
        clearInterval(safeWalkCountdownRef.current);
      }
      stopLocationTracking('safety');
      stopLocationTracking('safe_walk');
    };
  }, []);

  return (
    <SafetyContext.Provider value={{
      isActive,
      currentEventId,
      activateSafetyMode,
      deactivateSafetyMode,
      isLoading,
      isRecording,
      recordingDuration,
      isTimerActive,
      timerEndTime,
      timerDuration,
      startCheckInTimer,
      cancelCheckInTimer,
      checkIn,
      remainingTime,
      isSafeWalkActive,
      safeWalkDestination,
      safeWalkEta,
      startSafeWalk,
      endSafeWalk,
      safeWalkRemainingTime,
    }}>
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (context === undefined) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
};
