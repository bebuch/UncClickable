#!/bin/bash

# Generate PNG icons from Icon.svg using Inkscape and ImageMagick
# Requires: inkscape, imagemagick (magick command)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_DIR/icons"
SOURCE_SVG="$PROJECT_DIR/Icon.svg"

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Check if source SVG exists
if [ ! -f "$SOURCE_SVG" ]; then
    echo "Error: Icon.svg not found at $SOURCE_SVG"
    exit 1
fi

# Check for required tools
if ! command -v inkscape &> /dev/null; then
    echo "Error: inkscape is required but not installed"
    exit 1
fi

# Check for ImageMagick (magick for v7, convert for v6)
if command -v magick &> /dev/null; then
    IMAGEMAGICK="magick"
elif command -v convert &> /dev/null; then
    IMAGEMAGICK="convert"
else
    echo "Error: imagemagick (magick or convert) is required but not installed"
    exit 1
fi

echo "Generating icons from $SOURCE_SVG..."

# Icon sizes required for browser extensions
SIZES=(16 32 48 128)

# Generate color PNG icons using Inkscape
for size in "${SIZES[@]}"; do
    output="$ICONS_DIR/icon-${size}.png"
    echo "  Creating ${output}..."
    inkscape "$SOURCE_SVG" \
        --export-filename="$output" \
        --export-width="$size" \
        --export-height="$size" \
        2>/dev/null
done

# Generate grayscale PNG icons using ImageMagick
for size in "${SIZES[@]}"; do
    input="$ICONS_DIR/icon-${size}.png"
    output="$ICONS_DIR/icon-${size}-gray.png"
    echo "  Creating ${output}..."
    $IMAGEMAGICK "$input" -colorspace Gray -alpha on "$output"
done

echo "Done! Icons generated in $ICONS_DIR"
ls -la "$ICONS_DIR"
