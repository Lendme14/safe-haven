# Build Settings & Requirements

## System Requirements

### Required Software

| Component | Version | Required | Status |
|-----------|---------|----------|--------|
| Java JDK | 21+ | ✅ Yes | Installed: 25.0.1 |
| Gradle | 8.14.0+ | ✅ Yes | Configured |
| Android SDK | API 36 | ✅ Yes | For Android builds |
| Xcode | 15+ | ✅ Yes | For iOS builds |
| Node.js | 18+ | ✅ Yes | For web builds |
| npm/bun | Latest | ✅ Yes | For dependencies |

## Build Configuration

### Java Compatibility Settings

The project is configured to support **Java 21+** (tested with Java 25).

#### Configuration Files

1. **`android/build.gradle`**
   ```gradle
   dependencies {
       classpath 'com.android.tools.build:gradle:8.14.0'
   }
   ```

2. **`android/variables.gradle`**
   ```gradle
   ext {
       javaVersion = JavaVersion.VERSION_21
   }
   ```

3. **`android/app/build.gradle`**
   ```gradle
   compileOptions {
       sourceCompatibility rootProject.ext.javaVersion
       targetCompatibility rootProject.ext.javaVersion
   }
   ```

### Gradle Wrapper

- **Location**: `android/gradle/wrapper/gradle-wrapper.properties`
- **Version**: 8.14.3
- **Download**: https://services.gradle.org/distributions/gradle-8.14.3-all.zip

## Build Steps

### 1. Install Dependencies

```bash
# Using npm
npm install

# Or using bun (faster)
bun install
```

### 2. Build Web Assets

```bash
npm run build
# Output: dist/ directory with production build
```

### 3. Sync to Native Platforms

```bash
# Sync both platforms
npx cap sync

# Or sync specific platform
npx cap sync android
npx cap sync ios
```

### 4. Android Build

```bash
cd android

# Debug build
./gradlew assembleDebug

# Release build (requires keystore)
./gradlew assembleRelease

# Full build with tests
./gradlew build
```

### 5. iOS Build

```bash
cd ios

# Build for simulator
xcodebuild -workspace App/App.xcworkspace -scheme App -configuration Debug -destination generic/platform=iOS\ Simulator

# Build for device
xcodebuild -workspace App/App.xcworkspace -scheme App -configuration Release -destination generic/platform=iOS

# Or use Xcode
open App/App.xcworkspace
```

## Build Troubleshooting

### Issue: "Unsupported class file major version 69"

**Cause**: Using Java 21+ with old Gradle version (< 8.10)

**Solution**: Already fixed in this project
- Updated: `classpath 'com.android.tools.build:gradle:8.14.0'`
- Added Java version configuration to `variables.gradle`

### Issue: "Unable to resolve dependency"

**Solution**:
```bash
# Clear gradle cache
./gradlew clean

# Rebuild dependencies
./gradlew build
```

### Issue: "Could not find android.jar"

**Solution**:
```bash
# Update SDK
./gradlew updateSdk

# Or manually in Android Studio
# Tools > SDK Manager > Install API 36
```

## Plugin Configuration

All plugins are configured in **`capacitor.config.ts`**:

```typescript
const config: CapacitorConfig = {
  appId: 'com.mettaloid.sentri',
  appName: 'Sentri',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    },
  },
};
```

## Platform-Specific Settings

### Android Configuration

**`build.json`** - Signing and build settings:
```json
{
  "android": {
    "debug": {
      "keystore": null,
      "storePassword": null
    },
    "release": {
      "keystore": null,
      "keystoreType": "jks"
    },
    "gradle": {
      "javaSourceCompatibility": "21",
      "javaTargetCompatibility": "21"
    }
  }
}
```

**`AndroidManifest.xml`** - Permissions (already configured):
- INTERNET
- RECORD_AUDIO
- POST_NOTIFICATIONS
- VIBRATE
- USE_BIOMETRIC

### iOS Configuration

**`Info.plist`** - Privacy permissions (already configured):
- NSMicrophoneUsageDescription
- NSFaceIDUsageDescription
- NSLocalNetworkUsageDescription
- NSContactsUsageDescription

## Performance Optimizations

### Gradle Build Cache

```bash
# Enable build cache (default: enabled)
./gradlew build --build-cache

# Analyze build performance
./gradlew build --profile
```

### Parallel Builds

```bash
# Enable parallel compilation (in gradle.properties)
org.gradle.parallel=true
org.gradle.workers.max=8
```

### Incremental Compilation

```bash
# Already enabled in Gradle 8.14+
# Supports incremental Java/Kotlin compilation
```

## Continuous Integration

### Environment Variables

```bash
JAVA_HOME=/usr/lib/jvm/java-21-openjdk
GRADLE_HOME=/workspaces/safe-haven/android/gradle
ANDROID_HOME=/android/sdk
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions
java-version: 21
gradle-version: 8.14.0
android-sdk-level: 36

steps:
  - uses: actions/setup-java@v3
    with:
      java-version: '21'
  - run: npm install
  - run: npm run build
  - run: npx cap sync
  - run: cd android && ./gradlew assembleDebug
```

## Security Notes

1. **Keystore Management**: 
   - Never commit keystore files to version control
   - Use CI/CD secrets for signing

2. **Dependency Verification**:
   - All dependencies are verified as licensed
   - See [PLUGIN_LICENSES.md](PLUGIN_LICENSES.md)

3. **API Keys**:
   - Supabase keys should use environment variables
   - Never hardcode credentials

## Update Changelog

### January 25, 2026

- ✅ Updated Gradle from 8.13.0 to 8.14.0
- ✅ Added Java 21 compatibility
- ✅ Verified all plugin licenses
- ✅ Created comprehensive build documentation
- ✅ Fixed "Unsupported class file major version 69" error

## Related Documentation

- [PLUGIN_LICENSES.md](PLUGIN_LICENSES.md) - Complete license compliance
- [CORDOVA_BUILD_READY.md](CORDOVA_BUILD_READY.md) - Build preparation guide
- [CAPACITOR_SETUP.md](CAPACITOR_SETUP.md) - Original setup guide
- [CAPACITOR_WORKFLOW.md](CAPACITOR_WORKFLOW.md) - Development workflow

---

**Last Updated**: January 25, 2026  
**Build System**: Gradle 8.14.3  
**Java Version**: 21+  
**Status**: ✅ READY FOR BUILD
