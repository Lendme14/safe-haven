import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface SafetyContextType {
  // Safety Mode
  isActive: boolean;
  currentEventId: string | null;
  activateSafetyMode: () => Promise<void>;
  deactivateSafetyMode: () => Promise<void>;
  isLoading: boolean;
  
  // Check-in Timer
  isTimerActive: boolean;
  timerEndTime: Date | null;
  timerDuration: number; // minutes
  startCheckInTimer: (minutes: number) => void;
  cancelCheckInTimer: () => void;
  checkIn: () => void;
  remainingTime: number; // seconds
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check-in Timer State
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerEndTime, setTimerEndTime] = useState<Date | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Update remaining time every second
  useEffect(() => {
    if (isTimerActive && timerEndTime) {
      countdownRef.current = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((timerEndTime.getTime() - now.getTime()) / 1000));
        setRemainingTime(remaining);
        
        if (remaining <= 0) {
          // Timer expired - trigger missed check-in
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

  const handleMissedCheckIn = useCallback(async () => {
    if (!user) return;
    
    console.log('Check-in timer expired - alerting contacts');
    
    // Stop the timer
    setIsTimerActive(false);
    setTimerEndTime(null);
    setRemainingTime(0);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      // Create a safety event for the missed check-in
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

      // Get current location
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
          
          // Log location
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

      // Send alerts via edge function
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

    return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          await supabase.from('location_logs').insert({
            safety_event_id: eventId,
            user_id: user.id,
            latitude,
            longitude,
            accuracy,
          });
          
          resolve({ latitude, longitude });
        },
        (error) => {
          console.log('Location error:', error.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [user]);

  const activateSafetyMode = useCallback(async () => {
    if (!user || isActive) return;
    
    setIsLoading(true);
    
    try {
      const { data: event, error } = await supabase
        .from('safety_events')
        .insert({
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentEventId(event.id);
      setIsActive(true);

      // Capture initial location
      const location = await captureLocation(event.id);

      // Send alerts via edge function
      const { error: alertError } = await supabase.functions.invoke('send-alert', {
        body: {
          safety_event_id: event.id,
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
        description: "You're protected. Your contacts have been alerted.",
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
  }, [user, isActive, captureLocation]);

  const deactivateSafetyMode = useCallback(async () => {
    if (!user || !isActive || !currentEventId) return;

    setIsLoading(true);

    try {
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
        description: "Safety mode deactivated. Your contacts have been notified.",
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
  }, [user, isActive, currentEventId]);

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
  }, []);

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
    };
  }, []);

  return (
    <SafetyContext.Provider value={{
      isActive,
      currentEventId,
      activateSafetyMode,
      deactivateSafetyMode,
      isLoading,
      isTimerActive,
      timerEndTime,
      timerDuration,
      startCheckInTimer,
      cancelCheckInTimer,
      checkIn,
      remainingTime,
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
