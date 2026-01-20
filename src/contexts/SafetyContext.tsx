import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface SafetyContextType {
  isActive: boolean;
  currentEventId: string | null;
  activateSafetyMode: () => Promise<void>;
  deactivateSafetyMode: () => Promise<void>;
  isLoading: boolean;
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const captureLocation = useCallback(async (eventId: string) => {
    if (!user || !navigator.geolocation) return;

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
      },
      (error) => {
        console.log('Location error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      await captureLocation(event.id);

      // Alert trusted contacts
      const { data: contacts } = await supabase
        .from('trusted_contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (contacts && contacts.length > 0) {
        const alerts = contacts.map(contact => ({
          safety_event_id: event.id,
          trusted_contact_id: contact.id,
          user_id: user.id,
          alert_type: 'activation',
          status: 'sent',
        }));

        await supabase.from('contact_alerts').insert(alerts);
      }

      toast({
        title: "Safety Mode Active",
        description: "You're protected. Stay calm.",
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

      // Send deactivation alerts
      const { data: contacts } = await supabase
        .from('trusted_contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (contacts && contacts.length > 0) {
        const alerts = contacts.map(contact => ({
          safety_event_id: currentEventId,
          trusted_contact_id: contact.id,
          user_id: user.id,
          alert_type: 'deactivation',
          status: 'sent',
        }));

        await supabase.from('contact_alerts').insert(alerts);
      }

      setIsActive(false);
      setCurrentEventId(null);

      toast({
        title: "You're safe now",
        description: "Safety mode has been deactivated.",
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

  return (
    <SafetyContext.Provider value={{
      isActive,
      currentEventId,
      activateSafetyMode,
      deactivateSafetyMode,
      isLoading,
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
