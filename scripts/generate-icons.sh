#!/bin/bash

# Generate PNG icons from Icon.svg using Inkscape and ImageMagick
# Only generates icons if they don't exist or if Icon.svg is newer
# Requires: inkscape, imagemagick (magick command)
# Optional: optipng, pngcrush (for better compression)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_DIR/icons"
SOURCE_SVG="$PROJECT_DIR/Icon.svg"

# Icon sizes required for browser extensions
SIZES=(16 32 48 128)

# Check if icons need to be generated
needs_generation() {
    # Check if any icon is missing
    for size in "${SIZES[@]}"; do
        if [ ! -f "$ICONS_DIR/icon-${size}.png" ] || [ ! -f "$ICONS_DIR/icon-${size}-gray.png" ]; then
            return 0
        fi
    done
    
    # Check if source SVG is newer than any icon
    for size in "${SIZES[@]}"; do
        if [ "$SOURCE_SVG" -nt "$ICONS_DIR/icon-${size}.png" ]; then
            return 0
        fi
    done
    
    return 1
}

# Check if icons already exist and are up to date
if ! needs_generation; then
    echo "Icons are up to date, skipping generation."
    exit 0
fi

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

# Check for optional PNG optimization tools
HAS_OPTIPNG=false
HAS_PNGCRUSH=false
if command -v optipng &> /dev/null; then
    HAS_OPTIPNG=true
fi
if command -v pngcrush &> /dev/null; then
    HAS_PNGCRUSH=true
fi

# Function to optimize a PNG file with maximum compression
optimize_png() {
    local file="$1"
    
    if [ "$HAS_OPTIPNG" = false ] && [ "$HAS_PNGCRUSH" = false ]; then
        return
    fi
    
    local original_size=$(stat -c%s "$file")
    
    # First pass: optipng with maximum optimization level (-o7)
    # -o7: 240 trials for best compression
    # -strip all: remove all metadata chunks
    # -zm1-9: try all zlib memory levels (1080 total trials)
    if [ "$HAS_OPTIPNG" = true ]; then
        optipng -o7 -zm1-9 -strip all -quiet "$file"
    fi
    
    # Second pass: pngcrush with brute-force (176 methods)
    # -brute: try all 176 different compression methods
    # -reduce: lossless color-type and bit-depth reduction
    # -rem alla: remove all ancillary chunks (metadata)
    # -ow: overwrite original file
    if [ "$HAS_PNGCRUSH" = true ]; then
        pngcrush -brute -reduce -rem alla -ow -s "$file" 2>/dev/null || true
    fi
    
    local final_size=$(stat -c%s "$file")
    local saved=$((original_size - final_size))
    if [ $saved -gt 0 ]; then
        echo "    Optimized: saved $saved bytes ($(echo "scale=1; $saved * 100 / $original_size" | bc)%)"
    fi
}

echo "Generating icons from $SOURCE_SVG..."

# Generate color PNG icons using Inkscape
for size in "${SIZES[@]}"; do
    output="$ICONS_DIR/icon-${size}.png"
    echo "  Creating ${output}..."
    inkscape "$SOURCE_SVG" \
        --export-filename="$output" \
        --export-width="$size" \
        --export-height="$size" \
        2>/dev/null
    optimize_png "$output"
done

# Generate grayscale PNG icons using ImageMagick
for size in "${SIZES[@]}"; do
    input="$ICONS_DIR/icon-${size}.png"
    output="$ICONS_DIR/icon-${size}-gray.png"
    echo "  Creating ${output}..."
    $IMAGEMAGICK "$input" -colorspace Gray -alpha on "$output"
    optimize_png "$output"
done

echo "Done! Icons generated in $ICONS_DIR"
