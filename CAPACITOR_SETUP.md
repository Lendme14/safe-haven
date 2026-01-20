# Capacitor Setup for Safe Haven

This document outlines the Capacitor configuration for Android/iOS development with audio recording, biometric authentication, and persistent notifications.

## Installation & Setup

### Prerequisites
- Node.js >= 14.0.0
- Xcode >= 12.0 (for iOS development)
- Android Studio >= 4.1 (for Android development)
- npm or yarn

### Installed Packages

```bash
@capacitor/core       - Core Capacitor framework
@capacitor/cli        - Command-line interface
@capacitor/android    - Android platform
@capacitor/ios        - iOS platform
@capacitor/local-notifications - Local notifications API
@capacitor/camera     - Camera access (for future features)
```

## Configuration Files

### capacitor.config.ts
Main configuration file located at the project root with settings for:
- App ID: `com.mettaloid.sentri`
- App Name: `Sentri`
- Web Directory: `dist`
- Plugin configurations

## Platform Setup

### Android Setup

#### Permissions (AndroidManifest.xml)
The following permissions have been configured:

**Audio Recording:**
- `RECORD_AUDIO` - Required for audio recording
- `WRITE_EXTERNAL_STORAGE` - For saving recordings
- `READ_EXTERNAL_STORAGE` - For accessing recordings

**Notifications:**
- `POST_NOTIFICATIONS` - Required for Android 13+
- `VIBRATE` - For notification vibration

**Biometric:**
- `USE_BIOMETRIC` - For modern biometric APIs
- `USE_FINGERPRINT` - For legacy fingerprint API

**Feature Declarations:**
```xml
<uses-feature android:name="android.hardware.microphone" android:required="false" />
<uses-feature android:name="android.hardware.fingerprint" android:required="false" />
<uses-feature android:name="android.hardware.biometrics.face" android:required="false" />
```

#### Building Android
```bash
npm run build  # Build web assets
npx cap sync   # Sync to Android platform
npx cap open android  # Open in Android Studio
```

### iOS Setup

#### Privacy Descriptions (Info.plist)
Required privacy descriptions have been added to `ios/App/App/Info.plist`:

- **NSMicrophoneUsageDescription** - For audio recording
- **NSFaceIDUsageDescription** - For biometric authentication
- **NSLocalNetworkUsageDescription** - For location features
- **NSAppleMusicUsageDescription** - For media library access
- **NSCalendarsUsageDescription** - For calendar integration
- **NSContactsUsageDescription** - For emergency contacts

#### Building iOS
```bash
npm run build  # Build web assets
npx cap sync   # Sync to iOS platform
npx cap open ios  # Open in Xcode
```

## Service APIs

### 1. Audio Recording Service

Located at: `src/services/audioService.ts`

```typescript
import audioService from '@/services/audioService';

// Start recording
await audioService.startRecording({
  audioChannels: 1,
  audioSampleRate: 44100,
  audioBitRate: 128000,
});

// Get recording duration
const duration = audioService.getRecordingDuration();

// Stop recording
const blob = await audioService.stopRecording();

// Pause/Resume
audioService.pauseRecording();
audioService.resumeRecording();

// Convert to base64
const base64 = await audioService.blobToBase64(blob);

// Convert to File
const file = audioService.blobToFile(blob, 'recording.wav');

// Cleanup
audioService.dispose();
```

#### React Hook
```typescript
import { useAudioRecording } from '@/hooks/useCapacitor';

const MyComponent = () => {
  const {
    isRecording,
    recordingTime,
    recordedAudio,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecording();

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
      <span>{recordingTime}s</span>
    </div>
  );
};
```

### 2. Biometric Authentication Service

Located at: `src/services/biometricService.ts`

```typescript
import biometricService from '@/services/biometricService';

// Check availability
const isAvailable = await biometricService.isBiometricAvailable();

// Get biometry type
const type = await biometricService.getBiometryType();
// Returns: 'fingerprint', 'faceRecognition', 'iris', or 'unknown'

// Authenticate user
const result = await biometricService.authenticate({
  reason: 'Authenticate to access Safe Haven',
  subtitle: 'Your biometric data is secure',
});

if (result.success) {
  console.log('Authentication successful');
}

// Register biometric
const registerResult = await biometricService.registerBiometric();

if (registerResult.success) {
  console.log('Biometric registered');
}

// Clear biometric data (app-side)
await biometricService.clearBiometric();
```

#### React Hook
```typescript
import { useBiometricAuth } from '@/hooks/useCapacitor';

const MyComponent = () => {
  const {
    isAvailable,
    biometryType,
    isAuthenticating,
    authError,
    checkBiometricAvailability,
    authenticate,
    registerBiometric,
  } = useBiometricAuth();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  return (
    <div>
      {isAvailable && <p>Type: {biometryType}</p>}
      <button onClick={authenticate} disabled={isAuthenticating}>
        Authenticate
      </button>
      {authError && <p className="error">{authError}</p>}
    </div>
  );
};
```

### 3. Notification Service

Located at: `src/services/notificationService.ts`

```typescript
import notificationService from '@/services/notificationService';

// Simple notification
await notificationService.showNotification({
  title: 'Alert',
  body: 'This is a notification',
});

// Persistent notification (stays until dismissed)
const notifId = await notificationService.showPersistentNotification({
  title: 'Recording Active',
  body: 'Audio recording in progress',
  ongoing: true,
});

// Update persistent notification
await notificationService.updatePersistentNotification(notifId, {
  body: 'Recording completed',
});

// Progress notification
await notificationService.showProgressNotification(
  notifId,
  'Uploading',
  75,
  100 // 75%
);

// Specialized notifications
await notificationService.showSuccessNotification('Operation Completed');
await notificationService.showErrorNotification('Error', 'Something went wrong');
await notificationService.showAlertNotification('Alert', 'Attention needed');

// Cancel notifications
await notificationService.cancelNotification(notifId);
await notificationService.cancelAllNotifications();

// Get pending/delivered notifications
const pending = await notificationService.getPendingNotifications();
const delivered = await notificationService.getDeliveredNotifications();

// Create notification channel (Android)
await notificationService.createChannel('alerts', 'Alerts', 'Emergency alerts');
```

#### React Hook
```typescript
import { useNotifications } from '@/hooks/useCapacitor';

const MyComponent = () => {
  const {
    showNotification,
    showPersistentNotification,
    updateNotification,
    cancelNotification,
    showAlertNotification,
    showSuccessNotification,
  } = useNotifications();

  const handleEmergency = async () => {
    const id = await showPersistentNotification(
      'Safety Alert',
      'Emergency mode activated'
    );

    // Update after 5 seconds
    setTimeout(() => {
      updateNotification(id, { body: 'Alert sent to contacts' });
    }, 5000);
  };

  return (
    <button onClick={handleEmergency}>
      Emergency Alert
    </button>
  );
};
```

## Build & Run Commands

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Sync platform files
npx cap sync

# Sync specific platform
npx cap sync android
npx cap sync ios

# Open platform IDE
npx cap open android
npx cap open ios

# Build and preview (web)
npm run preview
```

## Platform-Specific Notes

### Android
- Minimum API Level: 24 (Android 7.0)
- Permissions are requested at runtime for Android 6.0+
- Notifications require Android 5.0+ for persistent notifications
- Audio recording works on Android 5.0+

### iOS
- Minimum iOS Version: 12.0
- FaceID or TouchID support depends on device hardware
- Privacy descriptions in Info.plist are mandatory
- Microphone permission requested on first app launch

## Troubleshooting

### Audio Recording Issues
- Ensure microphone permission is granted
- Check browser console for errors
- On iOS, verify microphone is not already in use

### Biometric Not Working
- Verify device has biometric hardware
- Ensure WebAuthn API is available
- Check that browser supports required APIs

### Notification Issues
- Create notification channels on Android 8.0+
- Check notification permissions are granted
- Verify app is not in "Do Not Disturb" mode

## Security Considerations

1. **Audio Recording**
   - Inform users when recording
   - Secure recorded data with encryption
   - Allow users to delete recordings

2. **Biometric Authentication**
   - Never store biometric data in plain text
   - Use WebAuthn for secure authentication
   - Implement fallback authentication

3. **Notifications**
   - Don't include sensitive data in notification body
   - Use notification channels for Android
   - Respect user notification preferences

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Development](https://developer.android.com/)
- [iOS Development](https://developer.apple.com/)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
