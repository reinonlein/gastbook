#!/bin/bash

# Stop het script als er een fout optreedt
set -e

# Print elke stap voor debuggen
set -x

# 1. Download Flutter (stable channel)
echo "Cloning Flutter repository..."
git clone --depth 1 --branch stable https://github.com/flutter/flutter.git /usr/local/flutter

# 2. Voeg Flutter toe aan het PATH
export PATH="$PATH:/usr/local/flutter/bin"

# 3. Update Flutter dependencies
echo "Running 'flutter doctor' to download dependencies..."
flutter doctor

# 4. Schakel ondersteuning voor Flutter Web in
echo "Enabling Flutter Web support..."
flutter config --enable-web

# 5. Controleer of alles correct is geïnstalleerd
echo "Verifying Flutter installation..."
flutter doctor -v

echo "Flutter installed successfully!"
