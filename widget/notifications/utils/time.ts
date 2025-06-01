import { GLib } from "astal"

// =============================================================================
// Time Formatting Utilities
// =============================================================================

export const formatTime = (time: number, format = "%H:%M"): string => 
    GLib.DateTime.new_from_unix_local(time).format(format)!

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