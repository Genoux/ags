export interface NotificationStoreConfig {
    maxStoredNotifications?: number
    ignoredApps?: string[]
    ignoredCategories?: string[]
    autoCleanupInterval?: number
}

export const DEFAULT_CONFIG: Required<NotificationStoreConfig> = {
    maxStoredNotifications: 100,
    ignoredApps: ["glib-pacman", "systemd", "spotify"],
    ignoredCategories: [],
    autoCleanupInterval: 300000 // 5 minutes
} 