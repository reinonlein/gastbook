# PWA Icons Setup

The PWA requires icon files for the manifest. You need to create the following icon files:

## Required Icons

1. `public/icon-192x192.png` - 192x192 pixels
2. `public/icon-512x512.png` - 512x512 pixels

## How to Generate Icons

You can use any of these methods:

### Option 1: Online Tools
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### Option 2: Image Editing Software
- Create a square logo/image (at least 512x512)
- Export as PNG at 192x192 and 512x512 sizes
- Place them in the `public/` folder

### Option 3: Using a Script
You can use a tool like `sharp` to generate icons from a source image:

```bash
npm install --save-dev sharp
```

Then create a script to generate icons from a source image.

## Temporary Solution

For development, you can use a simple colored square or your logo. The app will work without proper icons, but they're required for a production PWA.

