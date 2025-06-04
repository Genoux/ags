import { GLib } from "astal"

// =============================================================================
// Time Formatting Utilities
// =============================================================================

export const formatTime = (time: number, format = "%H:%M"): string => {
    try {
        // Convert milliseconds to seconds for GLib.DateTime
        const timeInSeconds = Math.floor(time / 1000)
        const dateTime = GLib.DateTime.new_from_unix_local(timeInSeconds)
        
        if (!dateTime) {
            // Fallback to JavaScript Date if GLib fails
            const date = new Date(time)
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            })
        }
        
        return dateTime.format(format)!
    } catch (error) {
        console.error("Error formatting time:", error)
        // Fallback formatting
        const date = new Date(time)
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        })
    }
}

export const formatRelativeTime = (timestamp: number): string => {
    const notificationTime = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - notificationTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return notificationTime.toLocaleDateString()
} 