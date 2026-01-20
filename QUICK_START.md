# 🚀 Capacitor Quick Start Guide

Complete setup for audio recording, biometric authentication, and persistent notifications.

## ⚡ 5-Minute Setup

### 1. Build and Sync
```bash
npm run build
npx cap sync
```

### 2. Test in Browser
```bash
npm run dev
# Navigate to http://localhost:8080 and test features
```

### 3. Test on Device
```bash
# Android
npx cap open android
# Or iOS
npx cap open ios
```

## 🎯 Using Services

### Audio Recording
```typescript
import { useAudioRecording } from '@/hooks/useCapacitor';

export function MyComponent() {
  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecording();

  return (
    <>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      {isRecording && <p>Recording: {recordingTime}s</p>}
    </>
  );
}
```

### Biometric Authentication
```typescript
import { useBiometricAuth } from '@/hooks/useCapacitor';

export function AuthComponent() {
  const { isAvailable, authenticate, registerBiometric } = useBiometricAuth();

  return (
    <>
      {isAvailable && (
        <>
          <button onClick={authenticate}>Authenticate</button>
          <button onClick={registerBiometric}>Register Biometric</button>
        </>
      )}
    </>
  );
}
```

### Persistent Notifications
```typescript
import { useNotifications } from '@/hooks/useCapacitor';

export function NotificationComponent() {
  const { showPersistentNotification, updateNotification } = useNotifications();

  const handleAlert = async () => {
    const id = await showPersistentNotification({
      title: 'Alert',
      body: 'Important message'
    });
    
    // Update after 2 seconds
    setTimeout(() => {
      updateNotification(id, { body: 'Updated message' });
    }, 2000);
  };

  return <button onClick={handleAlert}>Show Alert</button>;
}
```

## 📁 File Locations

| File | Purpose |
|------|---------|
| `src/services/audioService.ts` | Audio recording |
| `src/services/biometricService.ts` | Biometric auth |
| `src/services/notificationService.ts` | Notifications |
| `src/hooks/useCapacitor.ts` | React hooks |
| `src/components/CapacitorDemo.tsx` | Demo component |
| `capacitor.config.ts` | Configuration |

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production

# Capacitor
npx cap sync            # Sync to all platforms
npx cap open android    # Open Android Studio
npx cap open ios        # Open Xcode

# Build & Run
npm run build && npx cap sync android
npx cap open android
```

## 📋 Checklist

- [ ] `npm install` (dependencies installed)
- [ ] `npm run build` (web assets built)
- [ ] `npx cap sync` (platforms synced)
- [ ] `npx cap open android` or `npx cap open ios`
- [ ] Grant permissions when prompted
- [ ] Test audio recording
- [ ] Test biometric auth
- [ ] Test notifications

## 🎨 Demo Component

View all features in action:
```typescript
import CapacitorDemoPage from '@/components/CapacitorDemo';

// Use in your routing
<Route path="/demo" element={<CapacitorDemoPage />} />
```

## ✅ Verification

### Android Permissions Configured
- ✅ RECORD_AUDIO
- ✅ POST_NOTIFICATIONS  
- ✅ USE_BIOMETRIC

### iOS Privacy Keys Added
- ✅ NSMicrophoneUsageDescription
- ✅ NSFaceIDUsageDescription
- ✅ NSContactsUsageDescription

## 🐛 Troubleshooting

### "Module not found" error
```bash
npm install
npm run build
npx cap sync
```

### Permissions not working
- **Android:** Check `android/app/src/main/AndroidManifest.xml`
- **iOS:** Check `ios/App/App/Info.plist`

### Changes not appearing
```bash
npm run build
npx cap sync
npx cap open android  # Clean build in Studio
```

## 📚 Documentation

- **Full Setup:** See `CAPACITOR_SETUP.md`
- **Workflow:** See `CAPACITOR_WORKFLOW.md`
- **File Index:** See `CAPACITOR_IMPLEMENTATION_INDEX.md`
- **Summary:** See `CAPACITOR_SETUP_SUMMARY.md`

## 🔗 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Docs](https://developer.android.com/)
- [iOS Docs](https://developer.apple.com/)

---

**Status:** ✅ Ready to Use  
**Version:** 1.0  
**Last Updated:** January 20, 2026
