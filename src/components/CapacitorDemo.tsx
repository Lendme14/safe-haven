import React, { useEffect, useState } from 'react';
import { useAudioRecording, useBiometricAuth, useNotifications } from '@/hooks/useCapacitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mic, Fingerprint, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Example component demonstrating audio recording capability
 */
export const AudioRecordingDemo: React.FC = () => {
  const { isRecording, recordingTime, recordedAudio, startRecording, stopRecording } =
    useAudioRecording();
  const { showSuccessNotification, showErrorNotification } = useNotifications();

  const handleStartRecording = async () => {
    try {
      await startRecording();
      await showSuccessNotification('Recording Started');
    } catch (error) {
      await showErrorNotification('Recording Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      const audio = await stopRecording();
      await showSuccessNotification(
        'Recording Saved',
        `${(audio.size / 1024).toFixed(2)} KB`
      );
    } catch (error) {
      await showErrorNotification('Error', 'Failed to stop recording');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Audio Recording
        </CardTitle>
        <CardDescription>
          Record and save audio in your app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRecording && (
          <Alert className="bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Recording: {recordingTime}s
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleStartRecording}
            disabled={isRecording}
            className="flex-1"
          >
            Start Recording
          </Button>
          <Button
            onClick={handleStopRecording}
            disabled={!isRecording}
            variant="destructive"
            className="flex-1"
          >
            Stop Recording
          </Button>
        </div>

        {recordedAudio && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">Recording saved</p>
            <p className="text-xs text-gray-600">
              Size: {(recordedAudio.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Example component demonstrating biometric authentication
 */
export const BiometricAuthDemo: React.FC = () => {
  const {
    isAvailable,
    biometryType,
    isAuthenticating,
    authError,
    checkBiometricAvailability,
    authenticate,
    registerBiometric,
  } = useBiometricAuth();
  const { showSuccessNotification, showAlertNotification } = useNotifications();

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  const handleAuthenticate = async () => {
    const success = await authenticate();
    if (success) {
      await showSuccessNotification('Authentication Successful');
    } else {
      await showAlertNotification('Authentication Failed', authError);
    }
  };

  const handleRegister = async () => {
    const success = await registerBiometric();
    if (success) {
      await showSuccessNotification('Biometric Registered');
    }
  };

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5" />
            Biometric Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              Biometric authentication is not available on this device.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5" />
          Biometric Authentication
        </CardTitle>
        <CardDescription>
          {biometryType === 'faceRecognition' ? 'Face ID' : 'Fingerprint'} authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authError && (
          <Alert className="bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="flex-1"
          >
            {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
          </Button>
          <Button
            onClick={handleRegister}
            disabled={isAuthenticating}
            variant="outline"
            className="flex-1"
          >
            Register
          </Button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium">Type: {biometryType}</p>
          <p className="text-gray-600">
            {biometryType === 'faceRecognition'
              ? 'Face ID is available on this device'
              : biometryType === 'fingerprint'
                ? 'Fingerprint scanning is available'
                : 'Biometric type unknown'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Example component demonstrating notifications
 */
export const NotificationDemo: React.FC = () => {
  const [notificationId, setNotificationId] = useState<number | null>(null);
  const {
    showNotification,
    showPersistentNotification,
    updateNotification,
    cancelNotification,
    showProgressNotification,
    showAlertNotification,
    showSuccessNotification,
  } = useNotifications();

  const handleSimpleNotification = async () => {
    await showNotification('Hello', 'This is a simple notification');
  };

  const handlePersistentNotification = async () => {
    const id = await showPersistentNotification(
      'Recording Active',
      'Audio recording in progress...'
    );
    setNotificationId(id);
  };

  const handleUpdateNotification = async () => {
    if (notificationId) {
      await updateNotification(notificationId, {
        body: 'Recording completed and saved',
      });
    }
  };

  const handleProgressNotification = async () => {
    const id = await showPersistentNotification('Upload', 'Starting...');
    setNotificationId(id);

    for (let i = 0; i <= 100; i += 25) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await showProgressNotification(id, 'Uploading File', i, 100);
    }
  };

  const handleCancelNotification = async () => {
    if (notificationId) {
      await cancelNotification(notificationId);
      setNotificationId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Test different notification types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleSimpleNotification} size="sm" variant="outline">
            Simple
          </Button>
          <Button onClick={handlePersistentNotification} size="sm" variant="outline">
            Persistent
          </Button>
          <Button onClick={handleUpdateNotification} size="sm" variant="outline">
            Update
          </Button>
          <Button onClick={handleProgressNotification} size="sm" variant="outline">
            Progress
          </Button>
          <Button onClick={handleAlertNotification} size="sm" variant="outline">
            Alert
          </Button>
          <Button onClick={handleCancelNotification} size="sm" variant="destructive">
            Cancel
          </Button>
        </div>

        {notificationId && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Active Notification</p>
            <p className="text-gray-600">ID: {notificationId}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const handleAlertNotification = async () => {
  const { showAlertNotification } = useNotifications();
  await showAlertNotification('Alert Title', 'This is an alert notification');
};

/**
 * Complete demo page with all features
 */
export const CapacitorDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Capacitor Features Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Test audio recording, biometric authentication, and notifications
          </p>
        </div>

        <AudioRecordingDemo />
        <BiometricAuthDemo />
        <NotificationDemo />
      </div>
    </div>
  );
};

export default CapacitorDemoPage;
