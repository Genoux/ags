#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AGS_DIR="$(dirname "$0")"
DEBOUNCE_TIME=0.3
DEBOUNCE_PID_FILE="/tmp/ags-debounce.pid"

# Function to print colored output
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] SUCCESS:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

# Simple restart function
restart_ags() {
    log "Restarting AGS..."
    
    # Quit AGS gracefully
    ags quit >/dev/null 2>&1
    
    # Wait a moment
    sleep 0.2
    
    # Start AGS again
    cd "$AGS_DIR"
    ags run . >/dev/null 2>&1 &
    
    # Quick check if it started
    sleep 0.2
    if pgrep -f "ags" >/dev/null 2>&1; then
        success "AGS restarted"
    else
        error "AGS failed to restart"
    fi
}

# Debounced restart
debounced_restart() {
    local lock_file="/tmp/ags-restart.lock"
    
    # Check if restart is already in progress
    if [ -f "$lock_file" ]; then
        return 0
    fi
    
    # Kill existing debounce
    if [ -f "$DEBOUNCE_PID_FILE" ]; then
        kill $(cat "$DEBOUNCE_PID_FILE" 2>/dev/null) 2>/dev/null
        rm -f "$DEBOUNCE_PID_FILE"
    fi
    
    # Start new debounce
    (
        echo $$ > "$DEBOUNCE_PID_FILE"
        touch "$lock_file"
        sleep $DEBOUNCE_TIME
        rm -f "$DEBOUNCE_PID_FILE" "$lock_file"
        restart_ags
    ) &
}

# Dependency checks
if ! command -v ags >/dev/null; then
    error "AGS not found in PATH"
    exit 1
fi

if ! command -v inotifywait >/dev/null; then
    error "inotifywait not found. Install inotify-tools package"
    exit 1
fi

# Directory check
if [ ! -d "$AGS_DIR" ]; then
    error "AGS directory not found: $AGS_DIR"
    exit 1
fi

# Cleanup on exit
cleanup_on_exit() {
    log "Cleaning up..."
    ags quit >/dev/null 2>&1
    rm -f "$DEBOUNCE_PID_FILE"
    rm -f "/tmp/ags-restart.lock"
    exit 0
}

trap cleanup_on_exit INT TERM

echo -e "${BLUE}⚡ AGS Development Watcher${NC}"
echo -e "${BLUE}=========================${NC}"
log "Watching: $AGS_DIR"
log "Debounce: ${DEBOUNCE_TIME}s"

# Initial start
log "Starting AGS..."
cd "$AGS_DIR"
ags quit >/dev/null 2>&1  # Clean stop
sleep 0.2
ags run . >/dev/null 2>&1 &

sleep 0.3
if pgrep -f "ags" >/dev/null 2>&1; then
    success "AGS started successfully"
else
    error "AGS failed to start"
    exit 1
fi

# Watch for changes - simple and reliable
log "👀 Watching for changes..."

while true; do
    log "Starting file watcher..."
    
    inotifywait -m -r -e modify,create,delete,move "$AGS_DIR" 2>/dev/null | while read -r directory events filename; do
        
        # Skip directories we don't care about
        case "$directory" in
            *node_modules*|*.git*|*dist*|*build*) continue ;;
        esac
        
        # Only watch specific file types
        case "$filename" in
            *.ts|*.tsx|*.js|*.jsx|*.scss|*.css|*.json)
                # Skip hidden files and temp files
                case "$filename" in
                    .*|*~|*.tmp|*.swp) continue ;;
                esac
                
                warn "Changed: $filename"
                debounced_restart
                ;;
        esac
    done
    
    # If we get here, inotifywait exited
    error "File watcher exited, restarting in 2 seconds..."
    sleep 2
done