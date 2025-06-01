import { Widget, Astal, Gtk } from "astal/gtk3"
import { Variable, bind } from "astal"
import { createWindowManager } from "../WindowHelper"
import Mpris from "gi://AstalMpris"
import MediaPlayerComponent from "./MediaPlayer"

// Global state management
export const playerInteractions = new Map<string, number>()
export const lastActivePlayer = Variable<Mpris.Player | null>(null)
export const globalUpdateTrigger = Variable(0)

// Track interaction with a player
export function trackPlayerInteraction(player: Mpris.Player) {
    const busName = player.busName
    const now = Date.now()
    
    playerInteractions.set(busName, now)
    lastActivePlayer.set(player)
    
    // Trigger immediate UI update
    globalUpdateTrigger.set(globalUpdateTrigger.get() + 1)
    
    console.log(`[MediaPlayer] Interaction with ${player.identity || busName} at ${now}`)
}

// Set up monitoring for when players start playing (implicit interaction)
export function setupPlaybackMonitoring(players: Mpris.Player[]) {
    players.forEach(player => {
        let previousStatus = player.playbackStatus
        
        player.connect("notify::playback-status", () => {
            const currentStatus = player.playbackStatus
            
            // If player started playing (was not playing before), treat as interaction
            if (currentStatus === Mpris.PlaybackStatus.PLAYING && 
                previousStatus !== Mpris.PlaybackStatus.PLAYING) {
                console.log(`[MediaPlayer] ${player.identity || player.busName} started playing - treating as interaction`)
                trackPlayerInteraction(player)
            }
            
            previousStatus = currentStatus
        })
    })
}

// Get the most recently interacted player (simple timestamp-based)
export function getMostRecentPlayer(players: Mpris.Player[]): Mpris.Player | null {
    if (players.length === 0) return null
    if (players.length === 1) return players[0]
    
    // Find player with most recent interaction
    let mostRecentPlayer = players[0]
    let mostRecentTime = playerInteractions.get(mostRecentPlayer.busName) || 0
    
    for (const player of players) {
        const interactionTime = playerInteractions.get(player.busName) || 0
        if (interactionTime > mostRecentTime) {
            mostRecentTime = interactionTime
            mostRecentPlayer = player
        }
    }
    
    console.log(`[MediaPlayer] Showing most recent: ${mostRecentPlayer.identity || mostRecentPlayer.busName} (last interaction: ${mostRecentTime})`)
    return mostRecentPlayer
}

// Custom click handler for MPRIS integration
function handleMediaPlayerClick() {
    const mpris = Mpris.get_default()
    const players = mpris.players
    
    if (players.length > 0) {
        // Find the currently displayed player (most recent interaction)
        const activePlayer = getMostRecentPlayer(players)
        
        if (activePlayer && activePlayer.can_raise) {
            activePlayer.raise()
            trackPlayerInteraction(activePlayer) // Track this as an interaction
            
            console.log(`[MediaPlayer] Window clicked - raising ${activePlayer.identity || activePlayer.busName}`)
        }
    }
    
    // Close window after opening media app
    mediaPlayer.toggle()
}

// Create window manager with MPRIS integration
const mediaPlayer = createWindowManager({
    name: "media-player",
    className: "media-player-window",
    content: MediaPlayerComponent(),
    onWindowClick: handleMediaPlayerClick
})

// Create a variable that tracks if there are any players available
export const hasMediaPlayers = bind(globalUpdateTrigger).as(() => {
    const mpris = Mpris.get_default()
    return mpris.players.length > 0
})

export { mediaPlayer }