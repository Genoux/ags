// Apps to ignore from count and notification center (but still show in popup)
const IGNORED_FROM_COUNT_AND_CENTER: string[] = [
    "spotify", // Note: using lowercase for case-insensitive matching
]

// Apps to ignore completely (don't show anywhere)
const COMPLETELY_IGNORED_APPS: string[] = [
]

// Helper function to check if notification should be ignored from count and center
export function shouldIgnoreFromCountAndCenter(notification: any): boolean {
    const appName = notification.app_name?.toLowerCase() || ""
    const desktopEntry = notification.desktop_entry?.toLowerCase() || ""
    
    return IGNORED_FROM_COUNT_AND_CENTER.some(ignoredApp => 
        appName.includes(ignoredApp.toLowerCase()) || 
        desktopEntry.includes(ignoredApp.toLowerCase())
    )
}

// Helper function to check if notification should be completely ignored
export function shouldCompletelyIgnore(notification: any): boolean {
    const appName = notification.app_name?.toLowerCase() || ""
    const desktopEntry = notification.desktop_entry?.toLowerCase() || ""
    
    return COMPLETELY_IGNORED_APPS.some(ignoredApp => 
        appName.includes(ignoredApp.toLowerCase()) || 
        desktopEntry.includes(ignoredApp.toLowerCase())
    )
}

// Helper function to filter notifications for notification center (excludes count+center ignored and completely ignored)
export function filterVisibleNotifications(notifications: any[]): any[] {
    return notifications.filter(notif => 
        !shouldIgnoreFromCountAndCenter(notif) && !shouldCompletelyIgnore(notif)
    )
}

// Helper function to filter notifications for popup (only excludes completely ignored)
export function filterPopupNotifications(notifications: any[]): any[] {
    return notifications.filter(notif => !shouldCompletelyIgnore(notif))
}

// Helper function to get count (excludes count+center ignored and completely ignored)
export function getCountableNotificationCount(notifications: any[]): number {
    return filterVisibleNotifications(notifications).length
} 