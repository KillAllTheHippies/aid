#!/usr/bin/env bash
# AID Browser Extension Build Script (Bash)
# Creates store-ready archives for Chrome, Firefox, and Edge.
#
# Usage:
#   ./build.sh              # Build all targets
#   ./build.sh chrome       # Build Chrome only
#   ./build.sh firefox      # Build Firefox only
#   ./build.sh edge         # Build Edge only
#
# Requirements: zip, jq (for Firefox manifest merging)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"

# Files to include in the extension
EXTENSION_FILES=(
    manifest.json
    background.js
    content.js
    unicode-chars.js
    shared-ui.js
    shared.css
    popup.html
    popup.js
    popup.css
    panel.html
    panel.js
    panel.css
    styles.css
    icons/icon16.png
    icons/icon32.png
    icons/icon48.png
    icons/icon128.png
)

copy_files() {
    local dest="$1"
    mkdir -p "$dest/icons"
    for file in "${EXTENSION_FILES[@]}"; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            cp "$SCRIPT_DIR/$file" "$dest/$file"
        else
            echo "  ⚠ Missing: $file" >&2
        fi
    done
}

build_chrome() {
    echo ""
    echo "[Chrome] Building..."
    local out="$DIST_DIR/chrome"
    rm -rf "$out"
    copy_files "$out"

    local zip="$DIST_DIR/aid-chrome.zip"
    rm -f "$zip"
    (cd "$out" && zip -rq "$zip" .)
    echo "[Chrome] Created: $zip"
}

build_firefox() {
    echo ""
    echo "[Firefox] Building..."

    if ! command -v jq &>/dev/null; then
        echo "Error: jq is required for Firefox builds (manifest merging)" >&2
        echo "Install: apt install jq / brew install jq / pacman -S jq" >&2
        return 1
    fi

    local out="$DIST_DIR/firefox"
    rm -rf "$out"
    copy_files "$out"

    # Merge Firefox manifest overrides
    local base="$SCRIPT_DIR/manifest.json"
    local overrides="$SCRIPT_DIR/manifest.firefox.json"
    local merged="$out/manifest.json"

    jq -s '
        .[0] as $base | .[1] as $ff |
        $base
        | .browser_specific_settings = $ff.browser_specific_settings
        | .sidebar_action = $ff.sidebar_action
        | del(.side_panel)
        | .permissions = [.permissions[] | select(. != "sidePanel")]
    ' "$base" "$overrides" > "$merged"

    local xpi="$DIST_DIR/aid-firefox.xpi"
    rm -f "$xpi"
    (cd "$out" && zip -rq "$xpi" .)
    echo "[Firefox] Created: $xpi"
}

build_edge() {
    echo ""
    echo "[Edge] Building..."
    local out="$DIST_DIR/edge"
    rm -rf "$out"
    copy_files "$out"

    local zip="$DIST_DIR/aid-edge.zip"
    rm -f "$zip"
    (cd "$out" && zip -rq "$zip" .)
    echo "[Edge] Created: $zip"
}

# ── Main ─────────────────────────────────────────────────────────────────────

echo "AID Browser Extension Builder"
echo "============================="

mkdir -p "$DIST_DIR"

target="${1:-all}"
case "$target" in
    chrome)  build_chrome  ;;
    firefox) build_firefox ;;
    edge)    build_edge    ;;
    all)     build_chrome; build_firefox; build_edge ;;
    *)
        echo "Usage: $0 [chrome|firefox|edge|all]" >&2
        exit 1
        ;;
esac

echo ""
echo "Done!"
