#!/bin/bash

# Exit on error
set -e

# Install Flutter
echo "Installing Flutter..."
git clone https://github.com/flutter/flutter.git -b stable --depth 1 /tmp/flutter
export PATH="$PATH:/tmp/flutter/bin"

# Check Flutter installation
flutter --version

# Navigate to Flutter app directory
cd armed_forces_app

# Get dependencies
flutter pub get

# Build web app
flutter build web --release

echo "Flutter web build completed successfully!" 