#!/bin/bash
set -e

# Download Flutter SDK
curl -L https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.19.3-stable.tar.xz -o flutter.tar.xz

# Extract Flutter
tar xf flutter.tar.xz

# Add Flutter to PATH
export PATH="$PATH:`pwd`/flutter/bin"

# Run Flutter doctor
flutter doctor

# Build the web app
cd armed_forces_app
flutter pub get
flutter build web 