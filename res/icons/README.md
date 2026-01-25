# App Icons

Place your app icons in this folder with the following structure:

## Android Icons

```
android/
├── icon-36-ldpi.png      (36x36)
├── icon-48-mdpi.png      (48x48)
├── icon-72-hdpi.png      (72x72)
├── icon-96-xhdpi.png     (96x96)
├── icon-144-xxhdpi.png   (144x144)
├── icon-192-xxxhdpi.png  (192x192)
├── icon-background.png   (432x432 - solid color for adaptive icons)
├── icon-foreground-ldpi.png   (36x36)
├── icon-foreground-mdpi.png   (48x48)
├── icon-foreground-hdpi.png   (72x72)
├── icon-foreground-xhdpi.png  (96x96)
├── icon-foreground-xxhdpi.png (144x144)
└── icon-foreground-xxxhdpi.png (192x192)
```

## iOS Icons

```
ios/
├── icon-20.png          (20x20)
├── icon-20@2x.png       (40x40)
├── icon-20@3x.png       (60x60)
├── icon-29.png          (29x29)
├── icon-29@2x.png       (58x58)
├── icon-29@3x.png       (87x87)
├── icon-40.png          (40x40)
├── icon-40@2x.png       (80x80)
├── icon-40@3x.png       (120x120)
├── icon-50.png          (50x50)
├── icon-50@2x.png       (100x100)
├── icon-57.png          (57x57)
├── icon-57@2x.png       (114x114)
├── icon-60.png          (60x60)
├── icon-60@2x.png       (120x120)
├── icon-60@3x.png       (180x180)
├── icon-72.png          (72x72)
├── icon-72@2x.png       (144x144)
├── icon-76.png          (76x76)
├── icon-76@2x.png       (152x152)
├── icon-83.5@2x.png     (167x167)
└── icon-1024.png        (1024x1024)
```

## Quick Generation

Use [cordova-res](https://github.com/ionic-team/cordova-res) to auto-generate all icons from a single source image:

1. Create a 1024x1024 icon.png in the resources folder
2. Run: `npx cordova-res --skip-config --copy`

Or use an online tool like:
- https://appicon.co/
- https://makeappicon.com/
- https://icon.kitchen/
