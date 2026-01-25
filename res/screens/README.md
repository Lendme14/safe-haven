# Splash Screens

Place your splash screen images in this folder with the following structure:

## Android Splash Screens

```
android/
├── splash-land-ldpi.png     (320x200)
├── splash-land-mdpi.png     (480x320)
├── splash-land-hdpi.png     (800x480)
├── splash-land-xhdpi.png    (1280x720)
├── splash-land-xxhdpi.png   (1600x960)
├── splash-land-xxxhdpi.png  (1920x1280)
├── splash-port-ldpi.png     (200x320)
├── splash-port-mdpi.png     (320x480)
├── splash-port-hdpi.png     (480x800)
├── splash-port-xhdpi.png    (720x1280)
├── splash-port-xxhdpi.png   (960x1600)
└── splash-port-xxxhdpi.png  (1280x1920)
```

## iOS Splash Screens

iOS uses a single universal storyboard splash that scales:

```
ios/
├── Default@2x~universal~anyany.png   (2732x2732)
└── Default@3x~universal~anyany.png   (2732x2732)
```

## Design Guidelines

### For Sentri App:
- Use dark background (#0a0a0a or similar)
- Center the Sentri logo
- Keep important content in the center "safe zone" (middle 50%)
- Don't include text that needs to be readable at all sizes

### Quick Generation

Use [cordova-res](https://github.com/ionic-team/cordova-res) to auto-generate all splash screens:

1. Create a 2732x2732 splash.png in the resources folder
2. Run: `npx cordova-res --skip-config --copy`

Or use an online tool like:
- https://apetools.webprofusion.com/
- https://pgicons.abiro.com/
