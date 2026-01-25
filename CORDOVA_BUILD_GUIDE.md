# Sentri - Cordova Build Guide

Complete guide for building Sentri app using Apache Cordova.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be 18+
   ```

2. **Cordova CLI**
   ```bash
   npm install -g cordova
   cordova --version
   ```

3. **For Android:**
   - Java JDK 17 or higher
   - Android Studio with SDK (API 34)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Set environment variables:
     ```bash
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
     ```

4. **For iOS (macOS only):**
   - Xcode 15 or higher
   - Xcode Command Line Tools
   - CocoaPods
     ```bash
     sudo gem install cocoapods
     ```

## Project Setup

### 1. Clone and Install Dependencies

```bash
# Clone your project
git clone <your-repo-url>
cd sentri

# Install npm dependencies
npm install
```

### 2. Build the Web App

```bash
# Build production version
npm run build
```

### 3. Add Cordova Platforms

```bash
# Add Android platform
cordova platform add android

# Add iOS platform (macOS only)
cordova platform add ios
```

### 4. Install Cordova Plugins

```bash
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-media-capture
cordova plugin add cordova-plugin-local-notification
cordova plugin add cordova-plugin-fingerprint-aio
cordova plugin add cordova-plugin-vibration
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-media
```

### 5. Prepare Icons and Splash Screens

Before building, ensure you have all required assets in the `res/` folder:

```
res/
├── icons/
│   ├── android/
│   │   ├── icon-36-ldpi.png      (36x36)
│   │   ├── icon-48-mdpi.png      (48x48)
│   │   ├── icon-72-hdpi.png      (72x72)
│   │   ├── icon-96-xhdpi.png     (96x96)
│   │   ├── icon-144-xxhdpi.png   (144x144)
│   │   ├── icon-192-xxxhdpi.png  (192x192)
│   │   ├── icon-background.png   (432x432)
│   │   └── icon-foreground-*.png (various sizes)
│   └── ios/
│       ├── icon-20.png           (20x20)
│       ├── icon-20@2x.png        (40x40)
│       ├── icon-20@3x.png        (60x60)
│       ├── icon-29.png           (29x29)
│       ├── icon-29@2x.png        (58x58)
│       ├── icon-29@3x.png        (87x87)
│       ├── icon-40.png           (40x40)
│       ├── icon-40@2x.png        (80x80)
│       ├── icon-40@3x.png        (120x120)
│       ├── icon-60@2x.png        (120x120)
│       ├── icon-60@3x.png        (180x180)
│       ├── icon-76.png           (76x76)
│       ├── icon-76@2x.png        (152x152)
│       ├── icon-83.5@2x.png      (167x167)
│       └── icon-1024.png         (1024x1024)
└── screens/
    ├── android/
    │   ├── splash-land-*.png     (landscape splashes)
    │   └── splash-port-*.png     (portrait splashes)
    └── ios/
        ├── Default@2x~universal~anyany.png   (2732x2732)
        └── Default@3x~universal~anyany.png   (2732x2732)
```

**Tip:** Use a tool like [cordova-res](https://github.com/ionic-team/cordova-res) to auto-generate all icons:
```bash
npm install -g cordova-res
cordova-res --skip-config --copy
```

## Building the App

### Development Build

```bash
# Build for Android (debug)
cordova build android

# Build for iOS (debug)
cordova build ios
```

### Production/Release Build

#### Android APK/AAB

```bash
# Generate release APK
cordova build android --release

# The APK will be at:
# platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**Signing the APK:**

1. Create a keystore (first time only):
   ```bash
   keytool -genkey -v -keystore sentri-release.keystore \
     -alias sentri -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `build.json` in project root:
   ```json
   {
     "android": {
       "release": {
         "keystore": "sentri-release.keystore",
         "storePassword": "your-store-password",
         "alias": "sentri",
         "password": "your-key-password",
         "keystoreType": "jks"
       }
     }
   }
   ```

3. Build signed release:
   ```bash
   cordova build android --release --buildConfig=build.json
   ```

4. For Play Store, build AAB instead:
   ```bash
   cordova build android --release --buildConfig=build.json -- --packageType=bundle
   ```

#### iOS IPA

```bash
# Build for release
cordova build ios --release --device

# Open in Xcode for final configuration
open platforms/ios/Sentri.xcworkspace
```

In Xcode:
1. Select your Team in Signing & Capabilities
2. Archive the app (Product → Archive)
3. Export for App Store or Ad Hoc distribution

## Running on Devices

### Android

```bash
# Run on connected Android device
cordova run android --device

# Run on emulator
cordova run android --emulator

# List available emulators
cordova run android --list
```

### iOS

```bash
# Run on connected iPhone
cordova run ios --device

# Run on simulator
cordova run ios --emulator --target="iPhone-15-Pro"

# List available simulators
cordova run ios --list
```

## Troubleshooting

### Android Issues

**Gradle build fails:**
```bash
cd platforms/android
./gradlew clean
cd ../..
cordova build android
```

**SDK not found:**
```bash
# Ensure ANDROID_HOME is set
echo $ANDROID_HOME
# Should output something like /Users/you/Library/Android/sdk
```

### iOS Issues

**CocoaPods issues:**
```bash
cd platforms/ios
pod deintegrate
pod install
cd ../..
```

**Code signing errors:**
- Open Xcode and manually configure signing
- Ensure you have a valid Apple Developer account

### General Issues

**Plugin not working:**
```bash
cordova plugin remove <plugin-name>
cordova plugin add <plugin-name>
```

**Platform issues:**
```bash
cordova platform remove android
cordova platform add android
```

## Production Checklist

- [ ] Update version in `config.xml`
- [ ] Replace placeholder icons with branded assets
- [ ] Replace splash screens with branded assets
- [ ] Test all features on physical devices
- [ ] Test on multiple Android versions (API 24+)
- [ ] Test on multiple iOS versions (13.0+)
- [ ] Configure analytics (if applicable)
- [ ] Set up crash reporting
- [ ] Review and test all permissions
- [ ] Create signed release builds
- [ ] Test release builds on devices

## Useful Commands

```bash
# Check requirements
cordova requirements

# List installed platforms
cordova platform ls

# List installed plugins
cordova plugin ls

# Update platform
cordova platform update android

# Clean build
cordova clean

# Run with live reload (for development)
cordova run android --livereload
```

## Environment Variables

For production builds, ensure these are set:

```bash
# Android
export ANDROID_HOME=/path/to/android/sdk
export JAVA_HOME=/path/to/java/jdk

# iOS (set in Xcode preferences)
# Team ID and signing certificates
```

## Support

For issues specific to:
- **Cordova CLI:** https://cordova.apache.org/docs/
- **Android builds:** https://developer.android.com/studio
- **iOS builds:** https://developer.apple.com/documentation/xcode
