import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PremiumStatus {
  isPremium: boolean;
  maxContacts: number;
  hasCloudBackup: boolean;
  hasVideoRecording: boolean;
  hasTimelineExport: boolean;
}

export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPremiumStatus = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setIsPremium(data.is_premium || false);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  const upgradeToPremium = async () => {
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('user_id', user.id);

    if (!error) {
      setIsPremium(true);
      return true;
    }
    return false;
  };

  const status: PremiumStatus = {
    isPremium,
    maxContacts: isPremium ? 3 : 1,
    hasCloudBackup: isPremium,
    hasVideoRecording: isPremium,
    hasTimelineExport: isPremium,
  };

  return {
    ...status,
    isLoading,
    upgradeToPremium,
    refetch: fetchPremiumStatus,
  };
};
