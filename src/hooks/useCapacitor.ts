import { useState, useCallback } from 'react';
import audioService from '@/services/audioService';
import notificationService from '@/services/notificationService';
import biometricService from '@/services/biometricService';

/**
 * Hook for audio recording functionality
 */
export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

  const startRecording = useCallback(async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time every second
      const interval = setInterval(() => {
        setRecordingTime(audioService.getRecordingDuration());
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const audio = await audioService.stopRecording();
      setRecordedAudio(audio);
      setIsRecording(false);
      return audio;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      throw error;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    audioService.pauseRecording();
  }, []);

  const resumeRecording = useCallback(() => {
    audioService.resumeRecording();
  }, []);

  const clearRecording = useCallback(() => {
    setRecordedAudio(null);
    setRecordingTime(0);
  }, []);

  return {
    isRecording,
    recordingTime,
    recordedAudio,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  };
};

/**
 * Hook for biometric authentication
 */
export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('unknown');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const available = await biometricService.isBiometricAvailable();
      setIsAvailable(available);

      if (available) {
        const type = await biometricService.getBiometryType();
        setBiometryType(type);
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
    }
  }, []);

  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await biometricService.authenticate({
        reason: 'Authenticate to access Safe Haven',
        subtitle: 'Your biometric data is secure',
      });

      if (result.success) {
        return true;
      } else {
        setAuthError(result.message || 'Authentication failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthError(errorMessage);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const registerBiometric = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await biometricService.registerBiometric();

      if (result.success) {
        return true;
      } else {
        setAuthError(result.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthError(errorMessage);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return {
    isAvailable,
    biometryType,
    isAuthenticating,
    authError,
    checkBiometricAvailability,
    authenticate,
    registerBiometric,
  };
};

/**
 * Hook for notifications
 */
export const useNotifications = () => {
  const [notificationId, setNotificationId] = useState(0);

  const showNotification = useCallback(
    async (title: string, body: string, options?: any) => {
      try {
        const id = await notificationService.showNotification({
          title,
          body,
          ...options,
        });
        setNotificationId(id);
        return id;
      } catch (error) {
        console.error('Failed to show notification:', error);
        throw error;
      }
    },
    []
  );

  const showPersistentNotification = useCallback(
    async (title: string, body: string, options?: any) => {
      try {
        const id = await notificationService.showPersistentNotification({
          title,
          body,
          ...options,
        });
        setNotificationId(id);
        return id;
      } catch (error) {
        console.error('Failed to show persistent notification:', error);
        throw error;
      }
    },
    []
  );

  const updateNotification = useCallback(
    async (id: number, updates: any) => {
      try {
        await notificationService.updatePersistentNotification(id, updates);
      } catch (error) {
        console.error('Failed to update notification:', error);
        throw error;
      }
    },
    []
  );

  const cancelNotification = useCallback(async (id: number) => {
    try {
      await notificationService.cancelNotification(id);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      throw error;
    }
  }, []);

  const showProgressNotification = useCallback(
    async (
      id: number,
      title: string,
      progress: number,
      maxProgress: number = 100
    ) => {
      try {
        await notificationService.showProgressNotification(
          id,
          title,
          progress,
          maxProgress
        );
      } catch (error) {
        console.error('Failed to show progress notification:', error);
        throw error;
      }
    },
    []
  );

  const showAlertNotification = useCallback(
    async (title: string, message: string) => {
      try {
        const id = await notificationService.showAlertNotification(title, message);
        return id;
      } catch (error) {
        console.error('Failed to show alert notification:', error);
        throw error;
      }
    },
    []
  );

  const showSuccessNotification = useCallback(
    async (title: string, message?: string) => {
      try {
        const id = await notificationService.showSuccessNotification(
          title,
          message
        );
        return id;
      } catch (error) {
        console.error('Failed to show success notification:', error);
        throw error;
      }
    },
    []
  );

  const showErrorNotification = useCallback(
    async (title: string, message?: string) => {
      try {
        const id = await notificationService.showErrorNotification(title, message);
        return id;
      } catch (error) {
        console.error('Failed to show error notification:', error);
        throw error;
      }
    },
    []
  );

  return {
    notificationId,
    showNotification,
    showPersistentNotification,
    updateNotification,
    cancelNotification,
    showProgressNotification,
    showAlertNotification,
    showSuccessNotification,
    showErrorNotification,
  };
};
