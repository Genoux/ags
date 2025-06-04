export interface NotificationStoreConfig {
    maxStoredNotifications?: number
    ignoredApps?: string[]
    ignoredCategories?: string[]
    autoCleanupInterval?: number
    // New system notification options
    filterSystemNotifications?: boolean
    allowedSystemApps?: string[]
    systemNotificationKeywords?: string[]
}

export const DEFAULT_CONFIG: Required<NotificationStoreConfig> = {
    maxStoredNotifications: 100,
    ignoredApps: [
        // Package managers - usually too verbose
        "glib-pacman", "pacman", "yay", "paru",
        // System services - mostly noise
        "systemd", "dbus", "networkmanager",
        // Media players - can be noisy
        "spotify", "vlc", "mpv",
        // Desktop environment services
        "gnome-software", "kde-daemon", "xfce4-notifyd"
    ],
    ignoredCategories: [
        "x-gnome.music", // Music metadata
        "device.removed", // USB removal (usually expected)
    ],
    autoCleanupInterval: 300000, // 5 minutes
    // System notification filtering
    filterSystemNotifications: false, // Disabled by default
    allowedSystemApps: [
        "networkmanager", // Network status changes
        "upower", // Battery notifications
        "udisks2", // Mount/unmount notifications
        "polkit", // Authentication requests
        "system-config-printer" // Printer notifications
    ],
    systemNotificationKeywords: [
        "battery", "power", "network", "wifi", "bluetooth",
        "mount", "unmount", "usb", "security", "update"
    ]
} 