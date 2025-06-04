import { Gtk } from "astal/gtk3"
import { GLib, Gio } from "astal"
import Hyprland from "gi://AstalHyprland"
import { NotificationProps } from "../types"
import { getValidIcon, formatTime } from "../utils"
import { notificationStore } from "../store"

// =============================================================================
// Helper Functions
// =============================================================================

function focusSourceApp(notificationData: any): void {
    try {
        // Add guard to prevent issues with null/undefined notification data
        if (!notificationData) {
            console.log("No notification data provided")
            return
        }
        
        console.log("Attempting to focus app for:", notificationData.appName || notificationData.desktopEntry || "unknown")
        
        const hyprland = Hyprland.get_default()
        
        // Add guard for hyprland availability
        if (!hyprland) {
            console.log("Hyprland not available")
            return
        }
        
        // First, try to find and focus an existing window
        if (notificationData.desktopEntry || notificationData.appName) {
            let clients: any[] = []
            try {
                clients = hyprland.get_clients()
            } catch (error) {
                console.log("Failed to get Hyprland clients:", error)
                return // Return early if we can't get clients
            }
            
            const appName = notificationData.appName?.toLowerCase() || ""
            const desktopEntry = notificationData.desktopEntry?.toLowerCase() || ""
            
            // Look for a matching client window
            const matchingClient = clients.find(client => {
                if (!client) return false
                
                try {
                    const clientClass = client.class?.toLowerCase() || ""
                    const clientTitle = client.title?.toLowerCase() || ""
                    const clientInitialClass = client.initialClass?.toLowerCase() || ""
                    
                    return (
                        // Match by desktop entry
                        (desktopEntry && (
                            clientClass.includes(desktopEntry) ||
                            clientInitialClass.includes(desktopEntry)
                        )) ||
                        // Match by app name
                        (appName && (
                            clientClass.includes(appName) ||
                            clientTitle.includes(appName) ||
                            clientInitialClass.includes(appName)
                        ))
                    )
                } catch (error) {
                    console.log("Error checking client:", error)
                    return false
                }
            })
            
            if (matchingClient && matchingClient.address) {
                // Focus the existing window
                try {
                    GLib.spawn_command_line_async(`hyprctl dispatch focuswindow address:${matchingClient.address}`)
                    console.log(`Focused existing Hyprland window: ${matchingClient.class}`)
                    return
                } catch (error) {
                    console.log(`Failed to focus existing window: ${error}`)
                }
            }
        }
        
        //TODO: Simpler way to launch app
        // If no existing window found, try to launch the application
        if (notificationData.desktopEntry) {
            let desktopEntry = notificationData.desktopEntry
            
            // Normalize common desktop entries (handle case variations)
            const normalizedEntry = desktopEntry.toLowerCase()
            if (normalizedEntry === 'firefox') {
                desktopEntry = 'firefox'
            } else if (normalizedEntry === 'chromium') {
                desktopEntry = 'chromium'
            } else if (normalizedEntry === 'code') {
                desktopEntry = 'code'
            }
            
            // Try launching via desktop file
            try {
                GLib.spawn_command_line_async(`hyprctl dispatch exec gtk-launch ${desktopEntry}`)
                console.log(`Launched app via Hyprland: ${desktopEntry}`)
                return
            } catch (error) {
                console.log(`Failed to launch via Hyprland: ${error}`)
            }
            
            // Alternative: try direct launch
            try {
                GLib.spawn_command_line_async(`hyprctl dispatch exec ${desktopEntry}`)
                console.log(`Launched app directly via Hyprland: ${desktopEntry}`)
                return
            } catch (error) {
                console.log(`Failed to launch directly via Hyprland: ${error}`)
            }
        }
        
        // Fallback: try using app name
        if (notificationData.appName) {
            const appName = notificationData.appName.toLowerCase()
            
            // Try common application launch patterns with Hyprland dispatch
            const launchCommands = [
                `hyprctl dispatch exec ${appName}`,
                `hyprctl dispatch exec gtk-launch ${appName}`,
                `hyprctl dispatch exec gtk-launch ${appName}.desktop`,
            ]
            
            for (const cmd of launchCommands) {
                try {
                    GLib.spawn_command_line_async(cmd)
                    console.log(`Launched app via Hyprland fallback: ${cmd}`)
                    return
                } catch (error) {
                    // Continue to next attempt
                }
            }
        }
        
        console.log(`Could not focus/launch app for notification from ${notificationData.appName || 'unknown app'}`)
    } catch (error) {
        console.error("Error focusing source app on Hyprland:", error)
    }
}

// =============================================================================
// Sub-components
// =============================================================================

function NotificationHeader({ notification, timestamp, onDismiss, onMarkRead }: NotificationProps) {
    const appIcon = getValidIcon(
        notification.appIcon, 
        notification.desktopEntry, 
        notification.appName
    )

    return (
        <box className="notification-header" spacing={4}>
            <icon className="app-icon" icon={appIcon} />
            
            <label 
                className="app-name"
                label={notification.appName || "Unknown App"}
                hexpand
                halign={Gtk.Align.START}
            />
            
            <label 
                className="timestamp"
                label={formatTime(timestamp)}
            />
            
            <box className="action-buttons">
                {onDismiss && (
                    <button 
                        className="dismiss-btn"
                        onClicked={onDismiss}>
                        <icon icon="window-close-symbolic" />
                    </button>
                )}
            </box>
        </box>
    )
}

function NotificationContent({ 
    notification, 
    displaySummary, 
    displayBody 
}: Pick<NotificationProps, 'notification' | 'displaySummary' | 'displayBody'>) {
    const summary = displaySummary || notification.summary || ""
    const body = displayBody || notification.body || ""
    const hasImage = notification.image && notification.image.trim() !== ""

    return (
        <box className="notification-content">
            {hasImage && (
                <box 
                    className="notification-image"
                    css={`background-image: url('${notification.image}');`}
                />
            )}
            
            <box className="text-content" vertical>
                {summary && (
                    <label 
                        className="summary"
                        label={summary}
                        halign={Gtk.Align.START}
                        wrap
                        ellipsize={3} // PANGO_ELLIPSIZE_END
                    />
                )}
                
                {body && (
                    <label 
                        className="body"
                        label={body}
                        halign={Gtk.Align.START}
                        wrap
                        ellipsize={3}
                    />
                )}
            </box>
        </box>
    )
}

function NotificationActions({ 
    notification, 
    onActionClick 
}: Pick<NotificationProps, 'notification' | 'onActionClick'>) {
    const actions = notification.get_actions()

    return (
        <box className="notification-actions">
            {actions.map((action, index) => {
                try {
                    // Try to destructure, but handle malformed objects
                    const { label, id } = action || {}
                    console.log(`Action ${index}:`, { label, id })
                    
                    // Skip invalid actions
                    if (!label && !id) {
                        console.warn(`Skipping invalid action at index ${index}:`, action)
                        return null
                    }
                    
                    // Use destructured values with fallbacks
                    const actionLabel = label || `Action ${index + 1}`
                    const actionId = id || index.toString()
                    
                    return (
                        <button 
                            className="action-button"
                            onClicked={() => {
                                try {
                                    // Store notification data before invoking action to prevent accessing freed objects
                                    const notificationData = {
                                        id: notification.id,
                                        desktopEntry: notification.desktopEntry,
                                        appName: notification.appName,
                                        appIcon: notification.appIcon
                                    }
                                    
                                    console.log("Invoking action with ID:", actionId)
                                    
                                    // Invoke the action on the notification
                                    // The NotificationStore will automatically handle the "resolved" signal
                                    // if this action dismisses the notification
                                    notification.invoke(actionId)
                                    
                                    // Add a small delay before focusing to prevent race conditions
                                    // Use stored data instead of accessing notification object directly
                                    setTimeout(() => {
                                        try {
                                            focusSourceApp(notificationData)
                                        } catch (error) {
                                            console.error("Error focusing app after delay:", error)
                                        }
                                    }, 50)
                                    
                                    if (onActionClick) {
                                        onActionClick()
                                    }
                                } catch (error) {
                                    console.error("Failed to invoke notification action:", error)
                                }
                            }}>
                            <label label={actionLabel} />
                        </button>
                    )
                } catch (error) {
                    console.error(`Error processing action ${index}:`, error, action)
                    return null
                }
            }).filter(Boolean)} {/* Filter out null values */}
        </box>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export default function NotificationItem({
    notification,
    timestamp,
    isRead = false,
    onDismiss,
    onMarkRead,
    onActionClick,
    displaySummary,
    displayBody,
    showActions = true
}: NotificationProps) {
    const readClass = isRead ? "read" : "unread"
    
    // Check if notification has actions
    const actions = notification.get_actions()
    const hasActions = showActions && actions && actions.length > 0

    return (
        <eventbox 
            className={`notification ${readClass}`}>
            <box className="notification-container" vertical spacing={8}>
                <NotificationHeader 
                    notification={notification}
                    timestamp={timestamp}
                    onDismiss={onDismiss}
                    onMarkRead={onMarkRead}
                />
                
                <box className="separator" />
                
                <NotificationContent 
                    notification={notification}
                    displaySummary={displaySummary}
                    displayBody={displayBody}
                />
                
                {hasActions && (
                    <NotificationActions 
                        notification={notification}
                        onActionClick={onActionClick}
                    />
                )}
            </box>
        </eventbox>
    )
} 