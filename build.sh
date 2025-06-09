#!/bin/bash

npm install

# Install Flutter
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Install Flutter dependencies
flutter doctor

# Build the web app
cd armed_forces_app
flutter pub get
flutter build web 