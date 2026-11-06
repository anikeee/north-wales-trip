#!/bin/sh
# Build the Android app into dist/north-wales-trip.apk.
# Needs: Node, the Android SDK, and JDK 21 (Android Studio's bundled one is used if JAVA_HOME is not set).
# Signing: keystore.properties in the project root (never committed). Without it the APK is unsigned.
set -e
cd "$(dirname "$0")/.."

# Capacitor 8 compiles for Java 21. Use JAVA_HOME if it is 21 or newer, else Android Studio's bundled JDK.
JBR="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
java_major() { "$1/bin/java" -version 2>&1 | sed -n 's/.*version "\([0-9]*\).*/\1/p' | head -1; }
if [ -z "$JAVA_HOME" ] || [ "$(java_major "$JAVA_HOME")" -lt 21 ] 2>/dev/null; then
  if [ -d "$JBR" ]; then
    export JAVA_HOME="$JBR"
  else
    echo "Need JDK 21 or newer: set JAVA_HOME" >&2
    exit 1
  fi
fi
echo "Using Java $(java_major "$JAVA_HOME") from $JAVA_HOME"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

node scripts/check-data.mjs
npx cap sync android
(cd android && ./gradlew --no-daemon -q assembleRelease)

mkdir -p dist
OUT=android/app/build/outputs/apk/release
if [ -f "$OUT/app-release.apk" ]; then
  cp "$OUT/app-release.apk" dist/north-wales-trip.apk
  echo "Built dist/north-wales-trip.apk (signed)"
else
  cp "$OUT/app-release-unsigned.apk" dist/north-wales-trip-unsigned.apk
  echo "Built dist/north-wales-trip-unsigned.apk (no keystore.properties, so not signed)"
fi
