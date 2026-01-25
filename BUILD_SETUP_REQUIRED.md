# Build Setup Required - Safe Haven

## ⚠️ Critical Build Issues

### Issue 1: Unmet Cordova Plugin Dependencies
Your `package.json` declares Cordova plugins that are required for native builds, but they are not properly configured in the npm environment. These plugins are native bridges that connect your React app to native APIs.

**Status:** Cordova plugins are declared in dependencies but flagged as "UNMET DEPENDENCY" by npm because they're managed by Capacitor, not npm.

**Plugins Required:**
- `cordova-android` - Android platform integration
- `cordova-ios` - iOS platform integration  
- `cordova-plugin-device` - Device information API
- `cordova-plugin-fingerprint-aio` - Biometric authentication
- `cordova-plugin-geolocation` - Location services
- `cordova-plugin-local-notification` - Local notifications
- `cordova-plugin-media-capture` - Audio/video recording
- `cordova-plugin-splashscreen` - Launch screen
- `cordova-plugin-statusbar` - Status bar control
- `cordova-plugin-vibration` - Vibration feedback

**Solution:** These are managed by Capacitor's plugin system, not npm directly. See "Setup Instructions" below.

---

### Issue 2: Build Configuration Missing
The `build.json` file contains settings required to build for iOS and Android platforms, but they require configuration.

**Required Settings:**

#### Android Release Builds
```json
{
  "android": {
    "release": {
      "keystore": "path/to/your/keystore.jks",
      "storePassword": "your-store-password",
      "alias": "your-key-alias",
      "password": "your-key-password",
      "keystoreType": "jks"
    }
  }
}
```

#### iOS Release Builds
```json
{
  "ios": {
    "release": {
      "developmentTeam": "YOUR_TEAM_ID",
      "codeSignIdentity": "iPhone Distribution"
    }
  }
}
```

---

## Setup Instructions

### Step 1: Install NPM Dependencies
```bash
npm install
# or with bun
bun install
```

### Step 2: Sync Capacitor Plugins
```bash
# Sync all platforms
npx cap sync

# Or sync specific platforms
npx cap sync android
npx cap sync ios
```

This command:
- ✅ Installs native plugin code to Android and iOS projects
- ✅ Updates native manifests (AndroidManifest.xml, Info.plist)
- ✅ Syncs your web code to native projects

### Step 3: Build Web Assets
```bash
npm run build
```

This creates the `dist/` folder with optimized production assets.

---

## Building for Each Platform

### Android Debug Build
```bash
# Method 1: Using Capacitor (opens Android Studio)
npx cap open android

# Method 2: Command line
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Requirements:**
- Android SDK (API 24+)
- Android Studio (recommended)
- Gradle 8.13.0+

### Android Release Build
```bash
# Generate signing keystore (do this once)
keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Update build.json with keystore info
nano build.json

# Build
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS Debug Build
```bash
# Method 1: Using Xcode (recommended)
npx cap open ios

# Then build in Xcode: Product → Build

# Method 2: Command line
cd ios
xcodebuild -workspace App/App.xcworkspace -scheme App -configuration Debug
```

**Requirements:**
- macOS with Xcode installed
- Xcode 14.0+
- Apple Developer Account (for signing)

### iOS Release Build
```bash
# Update build.json with Team ID
nano build.json

# Build for release
cd ios
xcodebuild -workspace App/App.xcworkspace -scheme App \
  -configuration Release CODE_SIGN_IDENTITY="iPhone Distribution"
```

---

## Troubleshooting

### "Unsupported Plugins" Error
If you see warnings about unlicensed plugins, all plugins in this project are **open-source and properly licensed**:

| Plugin | License | Purpose |
|--------|---------|---------|
| cordova-plugin-device | Apache 2.0 | Device info |
| cordova-plugin-fingerprint-aio | MIT | Biometrics |
| cordova-plugin-geolocation | Apache 2.0 | Location |
| cordova-plugin-local-notification | Apache 2.0 | Notifications |
| cordova-plugin-media-capture | Apache 2.0 | Audio/Video |
| cordova-plugin-splashscreen | Apache 2.0 | Launch screen |
| cordova-plugin-statusbar | Apache 2.0 | Status bar |
| cordova-plugin-vibration | Apache 2.0 | Haptics |

All plugins are from the official Apache Cordova registry.

### "Gradle Build Failed"
- Ensure Android SDK is installed in Android Studio
- Check Java version: `java -version` (needs Java 11+)
- Clear gradle cache: `cd android && ./gradlew clean`

### "Pod install failed" (iOS)
- Update CocoaPods: `sudo gem install cocoapods`
- Clear pods: `rm -rf ios/Pods ios/Podfile.lock`
- Reinstall: `cd ios && pod install`

### Keystore Errors (Android)
Ensure the keystore path in `build.json` is **absolute or relative to the android/ directory**:
```json
{
  "android": {
    "release": {
      "keystore": "../my-release-key.keystore"
    }
  }
}
```

---

## Verification Checklist

Before building, verify all requirements are met:

- [ ] Node.js 16+ installed: `node -v`
- [ ] NPM dependencies installed: `npm list --depth=0`
- [ ] Web build succeeds: `npm run build`
- [ ] Capacitor plugins synced: `npx cap sync --version`
- [ ] Android SDK installed (Android builds): `android --version` or check Android Studio
- [ ] Xcode installed (iOS builds): `xcode-select -p`
- [ ] Signing credentials configured (release builds)
- [ ] `capacitor.config.ts` points to correct `webDir: 'dist'`

---

## Next Steps

1. Run: `npm install && npx cap sync`
2. Build web: `npm run build`
3. Open platform: `npx cap open android` or `npx cap open ios`
4. Build in native IDE or command line

For more help, see the [Capacitor Documentation](https://capacitorjs.com/docs).
