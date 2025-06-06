import { Gtk } from "astal/gtk3"
import { GLib } from "astal"
import Hyprland from "gi://AstalHyprland"
import { NotificationProps } from "../types"
import { getValidIcon, formatTime } from "../utils"

// =============================================================================
// Helper Functions
// =============================================================================

function openApp(notification: any): void {
    if (!notification) {
        console.log("No notification data provided")
        return
    }
    
    const { desktopEntry, appName } = notification
    console.log("Opening app:", { desktopEntry, appName })
    
    // Check for web notification URL
    let notificationUrl = null
    try {
        // Try to extract URL from notification hints or body
        if (notification.hints) {
            // Common hint keys for URLs
            notificationUrl = notification.hints['x-canonical-private-synchronous'] ||
                            notification.hints['desktop-entry'] ||
                            notification.hints['origin-url'] ||
                            notification.hints['action-default']
        }
        
        // If no URL in hints, try to extract from body or summary
        if (!notificationUrl) {
            const text = (notification.body || notification.summary || '').toLowerCase()
            const urlMatch = text.match(/(https?:\/\/[^\s]+)/i)
            if (urlMatch) {
                notificationUrl = urlMatch[1]
            }
        }
        
        console.log("Detected notification URL:", notificationUrl)
    } catch (error) {
        console.log("Could not extract URL from notification:", error)
    }
    
    // Check if app is already running
    const isAppRunning = checkIfAppIsRunning(desktopEntry, appName)
    
    if (isAppRunning) {
        console.log("App is already running, focusing existing window")
        focusExistingApp(desktopEntry, appName, notificationUrl)
        return
    }
    
    console.log("App not running, launching new instance")
    launchNewApp(desktopEntry, appName, notificationUrl)
}

function checkIfAppIsRunning(desktopEntry: string, appName: string): boolean {
    try {
        const hyprland = Hyprland.get_default()
        if (!hyprland) return false
        
        const clients = hyprland.get_clients()
        if (!clients) return false
        
        const searchTerms = [
            desktopEntry?.toLowerCase(),
            appName?.toLowerCase(),
            // Common mappings
            ...(appName?.toLowerCase().includes('firefox') ? ['firefox'] : []),
            ...(appName?.toLowerCase().includes('chrome') ? ['google-chrome', 'chrome'] : []),
            ...(desktopEntry?.toLowerCase().includes('firefox') ? ['firefox'] : []),
            ...(desktopEntry?.toLowerCase().includes('chrome') ? ['google-chrome', 'chrome'] : [])
        ].filter(Boolean)
        
        const isRunning = clients.some(client => {
            if (!client) return false
            
            const clientClass = client.class?.toLowerCase() || ""
            const clientInitialClass = client.initialClass?.toLowerCase() || ""
            
            return searchTerms.some(term => 
                clientClass.includes(term) || 
                clientInitialClass.includes(term)
            )
        })
        
        console.log(`App running check: ${isRunning} (searched for: ${searchTerms.join(', ')})`)
        return isRunning
    } catch (error) {
        console.log("Error checking if app is running:", error)
        return false
    }
}

function focusExistingApp(desktopEntry: string, appName: string, url?: string): void {
    try {
        const hyprland = Hyprland.get_default()
        if (!hyprland) return
        
        const clients = hyprland.get_clients()
        if (!clients) return
        
        const searchTerms = [
            desktopEntry?.toLowerCase(),
            appName?.toLowerCase(),
            // Common mappings
            ...(appName?.toLowerCase().includes('firefox') ? ['firefox'] : []),
            ...(appName?.toLowerCase().includes('chrome') ? ['google-chrome', 'chrome'] : []),
            ...(desktopEntry?.toLowerCase().includes('firefox') ? ['firefox'] : []),
            ...(desktopEntry?.toLowerCase().includes('chrome') ? ['google-chrome', 'chrome'] : [])
        ].filter(Boolean)
        
        const matchingClient = clients.find(client => {
            if (!client) return false
            
            const clientClass = client.class?.toLowerCase() || ""
            const clientInitialClass = client.initialClass?.toLowerCase() || ""
            
            return searchTerms.some(term => 
                clientClass.includes(term) || 
                clientInitialClass.includes(term)
            )
        })
        
        if (matchingClient) {
            console.log(`Found matching client:`, {
                class: matchingClient.class,
                address: matchingClient.address,
                workspace: matchingClient.workspace?.id
            })
            
            // Try multiple methods to focus the window
            const focusMethods = [
                // Method 1: Focus by class (most reliable)
                () => GLib.spawn_command_line_async(`hyprctl dispatch focuswindow class:${matchingClient.class}`),
                // Method 2: Focus by address (if available)
                ...(matchingClient.address ? [() => GLib.spawn_command_line_async(`hyprctl dispatch focuswindow address:${matchingClient.address}`)] : []),
                // Method 3: Switch to workspace then focus by class
                ...(matchingClient.workspace?.id ? [() => {
                    GLib.spawn_command_line_async(`hyprctl dispatch workspace ${matchingClient.workspace.id}`)
                    setTimeout(() => {
                        GLib.spawn_command_line_async(`hyprctl dispatch focuswindow class:${matchingClient.class}`)
                    }, 100)
                }] : [])
            ]
            
            let focused = false
            for (const method of focusMethods) {
                try {
                    method()
                    console.log(`Successfully focused window using method`)
                    focused = true
                    break
                } catch (error) {
                    console.log(`Focus method failed: ${error}`)
                }
            }
            
            if (!focused) {
                console.log("All focus methods failed, falling back to app launch")
                launchNewApp(desktopEntry, appName, url)
                return
            }
            
            // If we have a URL and it's a browser, open the URL in the existing instance
            if (url && (searchTerms.some(term => ['firefox', 'chrome'].some(browser => term.includes(browser))))) {
                setTimeout(() => {
                    try {
                        // Try to open URL in existing browser instance
                        if (searchTerms.some(term => term.includes('firefox'))) {
                            GLib.spawn_command_line_async(`firefox --new-tab "${url}"`)
                        } else if (searchTerms.some(term => term.includes('chrome'))) {
                            GLib.spawn_command_line_async(`google-chrome --new-tab "${url}"`)
                        }
                        console.log(`Opened URL in existing browser: ${url}`)
                    } catch (error) {
                        console.log(`Failed to open URL in existing browser: ${error}`)
                    }
                }, 500) // Small delay to ensure window is focused first
            }
        } else {
            console.log("No matching client found, launching new app")
            launchNewApp(desktopEntry, appName, url)
        }
    } catch (error) {
        console.error("Error focusing existing app:", error)
        // Fallback to launching new app
        launchNewApp(desktopEntry, appName, url)
    }
}

function launchNewApp(desktopEntry: string, appName: string, url?: string): void {
    // For browser notifications with URL, try to open with URL
    if (url && (desktopEntry?.toLowerCase().includes('firefox') || 
               desktopEntry?.toLowerCase().includes('chrome') ||
               desktopEntry?.toLowerCase().includes('chromium') ||
               appName?.toLowerCase().includes('firefox') ||
               appName?.toLowerCase().includes('chrome'))) {
        
        const browserCommands = [
            `firefox "${url}"`,
            `firefox-esr "${url}"`,
            `google-chrome "${url}"`,
            `google-chrome-stable "${url}"`,
            `chromium "${url}"`,
            `chromium-browser "${url}"`
        ]
        
        for (const cmd of browserCommands) {
            try {
                GLib.spawn_command_line_async(cmd)
                console.log(`Opened URL in new browser: ${cmd}`)
                return
            } catch (error) {
                console.log(`Failed to open URL with ${cmd}: ${error}`)
            }
        }
    }
    
    // Fallback: try desktop entry with URL (for browsers that support it)
    if (url && desktopEntry) {
        try {
            GLib.spawn_command_line_async(`gtk-launch ${desktopEntry.toLowerCase()} "${url}"`)
            console.log(`Launched with URL: ${desktopEntry.toLowerCase()} ${url}`)
            return
        } catch (error) {
            console.log(`Failed to launch with URL: ${error}`)
        }
    }
    
    // Standard app launching
    if (desktopEntry) {
        const desktopVariations = [
            desktopEntry.toLowerCase(),
            desktopEntry,
            desktopEntry.toLowerCase() + '.desktop',
            desktopEntry + '.desktop'
        ]
        
        for (const variant of desktopVariations) {
            try {
                const command = url ? 
                    `gtk-launch ${variant} "${url}"` : 
                    `gtk-launch ${variant}`
                    
                GLib.spawn_command_line_async(command)
                console.log(`Launched app: ${command}`)
                return
            } catch (error) {
                console.log(`Failed to launch ${variant}: ${error}`)
            }
        }
    }
    
    // Try common app name patterns
    if (appName) {
        const nameVariations = [
            appName.toLowerCase(),
            appName.toLowerCase().replace(/\s+/g, '-'),
            appName.toLowerCase().replace(/\s+/g, ''),
            // Common variations
            ...(appName.toLowerCase().includes('firefox') ? ['firefox', 'firefox-esr'] : []),
            ...(appName.toLowerCase().includes('chrome') ? ['google-chrome', 'google-chrome-stable'] : []),
            ...(appName.toLowerCase().includes('code') ? ['code', 'codium'] : [])
        ]
        
        for (const variant of nameVariations) {
            try {
                const command = url ? 
                    `${variant} "${url}"` : 
                    variant
                    
                GLib.spawn_command_line_async(command)
                console.log(`Launched app by name: ${command}`)
                return
            } catch (error) {
                console.log(`Failed to launch ${variant}: ${error}`)
            }
        }
    }
    
    console.warn(`Could not launch app for notification from ${appName || desktopEntry || 'unknown'}`)
}

// =============================================================================
// Sub-components
// =============================================================================

function NotificationHeader({ notification, timestamp, onDismiss }: NotificationProps) {
    const appIcon = getValidIcon(
        notification.appIcon, 
        notification.desktopEntry, 
        notification.appName
    )

    return (
        <box className="notification-header" spacing={8}>
            <box className="app-info" spacing={8}>
                <icon className="app-icon" icon={appIcon} />
                <label 
                    className="app-name"
                    label={notification.appName || "Unknown App"}
                    halign={Gtk.Align.START}
                />
            </box>
            
            <box hexpand /> {/* Spacer */}
            
            <label 
                className="timestamp"
                label={formatTime(timestamp)}
            />
            
            {onDismiss && (
                <button 
                    className="close-btn"
                    onClicked={onDismiss}
                    tooltip_text="Dismiss notification"
                >
                    <icon icon="window-close-symbolic" />
                </button>
            )}
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
        <box className="notification-content" spacing={8}>
            {hasImage && (
                <box 
                    className="notification-image"
                    css={`background-image: url('${notification.image}');`}
                />
            )}
            
            <box className="text-content" vertical spacing={4}>
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
    const actions = notification.get_actions() || []
    const hasActions = showActions && actions.length > 0
    
    // Check if notification has an associated app to launch
    const hasApp = notification.desktopEntry || 
                  (notification.appName && 
                   notification.appName !== "notify-send" && 
                   notification.appName !== "Unknown App" &&
                   notification.appName.trim() !== "")
    
    const eventboxProps = hasApp ? {
        className: `notification ${readClass} clickable`,
        onButtonPressEvent: () => {
            try {
                // Store notification data before any operations
                const notificationData = {
                    desktopEntry: notification.desktopEntry,
                    appName: notification.appName,
                    id: notification.id
                }
                
                // Mark as read when clicked
                onMarkRead?.()
                
                // First, try to invoke the default action (like action button did)
                try {
                    const actions = notification.get_actions() || []
                    const defaultAction = actions.find(action => 
                        action.id === "default" || 
                        action.id === "activate" ||
                        actions.length === 1 // If only one action, use it
                    )
                    
                    if (defaultAction) {
                        console.log("Invoking default action:", defaultAction.id)
                        notification.invoke(defaultAction.id)
                        
                        // Use stored data to open app after a delay (like action button did)
                        setTimeout(() => {
                            try {
                                openApp(notificationData)
                            } catch (error) {
                                console.error("Error opening app after action:", error)
                            }
                        }, 100)
                        
                        // Call the action callback like the original action button did
                        onActionClick?.()
                    } else {
                        // No default action, just open the app directly
                        openApp(notificationData)
                    }
                } catch (actionError) {
                    console.log("No action to invoke, opening app directly:", actionError)
                    // Fallback to direct app opening if action fails
                    openApp(notificationData)
                }
            } catch (error) {
                console.error("Error handling notification click:", error)
            }
            return false // Allow event to propagate
        }
    } : {
        className: `notification ${readClass}`
    }

    return (
        <eventbox {...eventboxProps}>
            <box className="notification-container" vertical>
                <NotificationHeader 
                    notification={notification}
                    timestamp={timestamp}
                    onDismiss={onDismiss}
                />
                
                <box className="separator" />
                
                <NotificationContent 
                    notification={notification}
                    displaySummary={displaySummary}
                    displayBody={displayBody}
                />
                
            </box>
        </eventbox>
    )
}