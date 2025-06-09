#!/bin/bash
set -e

# Install Flutter SDK
git clone https://github.com/flutter/flutter.git -b stable --depth 1 /opt/flutter
export PATH="$PATH:/opt/flutter/bin"

# Check Flutter installation
flutter --version

# Set up Flutter for web
flutter config --enable-web

# Navigate to app directory
cd /opt/render/project/src/armed_forces_app

# Get dependencies
flutter pub get

# Build web app with production environment variables
flutter build web \
  --release \
  --dart-define=API_URL=https://your-render-service-url.onrender.com \
  --web-renderer canvaskit

# Copy the build to the public directory
mkdir -p /opt/render/project/src/public
cp -r build/web/* /opt/render/project/src/public/

echo "Build completed successfully!" 