# Capacitor Development Workflow

## Available Commands

### Web Development
```bash
npm run dev         # Start Vite dev server (http://localhost:8080)
npm run build       # Build optimized web assets to dist/
npm run preview     # Preview production build locally
```

### Capacitor Sync & Build
```bash
npx cap sync        # Sync web assets and plugins to all platforms
npx cap sync android # Sync only Android platform
npx cap sync ios    # Sync only iOS platform

npx cap open android # Open Android project in Android Studio
npx cap open ios     # Open iOS project in Xcode
```

### Android Build & Run
```bash
# From the command line
npx cap sync android
npx cap open android

# Then in Android Studio:
# 1. Run > Run 'app' (or press Shift+F10)
# 2. Select target device or emulator
```

### iOS Build & Run
```bash
# From the command line
npx cap sync ios
npx cap open ios

# Then in Xcode:
# 1. Select target device or simulator
# 2. Product > Run (or press Cmd+R)
```

## Development Workflow

### For Web Development
1. **Start dev server:**
   ```bash
   npm run dev
   ```
   - Vite hot module reloading enabled
   - Access at http://localhost:8080

2. **Test in browser:**
   - Browser APIs available for testing
   - Use browser DevTools for debugging

### For Native Development

#### First Time Setup
```bash
npm install                 # Install dependencies
npm run build              # Build web assets
npx cap add android        # Add Android platform
npx cap add ios            # Add iOS platform
npx cap open android       # Open in Android Studio
npx cap open ios           # Open in Xcode
```

#### During Development
```bash
# After making changes to web code:
npm run build
npx cap sync               # Sync changes to platforms

# Or sync just one platform:
npx cap sync android
npx cap sync ios
```

#### Using Native IDEs

**Android Studio:**
- Emulator: Tools > AVD Manager
- Run app: Run button or Shift+F10
- Debug: Debug button or Shift+F9
- Logcat for console output

**Xcode:**
- Simulator: Product > Destination
- Run app: Run button or Cmd+R
- Debug: Debug navigator or breakpoints
- Console for output

### Testing Services

#### Test Audio Recording
1. Use the demo component at `/demo` route
2. Click "Start Recording"
3. Grant microphone permissions
4. Speak or make noise
5. Click "Stop Recording"
6. Check notification confirms save

#### Test Biometric Auth
1. Navigate to demo component
2. Click "Authenticate"
3. Use device biometric (fingerprint/face)
4. Receive success notification

#### Test Notifications
1. Click notification buttons in demo
2. Different notification types will appear
3. On Android: Check notification shade
4. On iOS: Check Notification Center

## Platform-Specific Setup

### Android Requirements
- Android SDK Platform 34
- Android API Level 24+ target
- Gradle 8.0+
- Java 17+

Install via Android Studio > SDK Manager

### iOS Requirements
- Xcode 12.0 or later
- CocoaPods (for dependencies)
- iOS 12.0+ target

Install with: `sudo gem install cocoapods`

## Troubleshooting

### "Missing dist directory" warning
```bash
npm run build   # Build assets first
npx cap sync    # Then sync
```

### Changes not appearing in app
```bash
npm run build   # Rebuild web assets
npx cap sync    # Resync to platform
```

### Permission denied errors
- Android: Check AndroidManifest.xml permissions
- iOS: Check Info.plist privacy keys

### Emulator/Simulator issues
```bash
# Android
npx cap open android  # Rebuild from Studio

# iOS
npx cap open ios     # Use Product > Clean Build Folder
```

## Debugging

### Browser/Web Debugging
- F12 or Right-click > Inspect
- Console, Network, Application tabs available

### Android Debugging
```bash
# View logs
adb logcat | grep "tag"

# Debug JavaScript
Chrome DevTools via chrome://inspect
```

### iOS Debugging
```bash
# Console in Xcode
# Or use Safari Web Inspector
# Develop > [Device] > [App]
```

## Performance Tips

1. **Minimize bundle size:** Use code splitting with React Router
2. **Optimize images:** Use appropriate formats and sizes
3. **Cache assets:** Service workers configured via Vite
4. **Lazy load components:** Use React.lazy() for routes
5. **Monitor performance:** Use Lighthouse or DevTools

## Next Steps

1. Review [CAPACITOR_SETUP.md](../CAPACITOR_SETUP.md) for API documentation
2. Check example component: [CapacitorDemo.tsx](../src/components/CapacitorDemo.tsx)
3. Review services in `src/services/` directory
4. Implement features in your app using provided hooks
5. Build and test on real devices

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Docs](https://developer.android.com/)
- [iOS Developer Docs](https://developer.apple.com/ios/)
- [Vite Documentation](https://vitejs.dev/)
