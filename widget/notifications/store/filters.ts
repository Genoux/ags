import Notifd from "gi://AstalNotifd"
import { StoredNotification, NotificationFilter } from "./types"
import { NotificationStoreConfig } from "./config"

export class NotificationFilters {
    constructor(private config: Required<NotificationStoreConfig>) {}

    shouldIgnoreNotification(notification: Notifd.Notification): boolean {
        const appName = notification.appName?.toLowerCase() || ""
        const desktopEntry = notification.desktopEntry?.toLowerCase() || ""
        const summary = notification.summary?.toLowerCase() || ""
        const body = notification.body?.toLowerCase() || ""
        
        // Check basic ignored apps first
        const matchedIgnoredApp = this.config.ignoredApps.find(app => 
            appName.includes(app.toLowerCase()) || desktopEntry.includes(app.toLowerCase())
        )
        if (matchedIgnoredApp) {
            return true
        }

        // Check ignored categories
        if (notification.category && this.config.ignoredCategories.includes(notification.category)) {
            return true
        }

        // System notification filtering (if enabled)
        if (this.config.filterSystemNotifications) {
            if (this.isSystemNotification(notification)) {
                // Allow if it's from an allowed system app
                const isAllowedSystemApp = this.config.allowedSystemApps.some(app => 
                    appName.includes(app.toLowerCase())
                )
                
                // Allow if it contains important keywords
                const hasImportantKeyword = this.config.systemNotificationKeywords.some(keyword =>
                    summary.includes(keyword.toLowerCase()) || body.includes(keyword.toLowerCase())
                )
                
                // Filter out if it's system but not explicitly allowed
                if (!isAllowedSystemApp && !hasImportantKeyword) {
                    return true
                }
            }
        }

        // Only filter completely empty notifications
        if (!notification.summary?.trim() && !notification.body?.trim()) {
            return true
        }

        return false
    }

    private isSystemNotification(notification: Notifd.Notification): boolean {
        const appName = notification.appName?.toLowerCase() || ""
        const desktopEntry = notification.desktopEntry?.toLowerCase() || ""
        
        // Common system notification indicators
        const systemIndicators = [
            "system", "daemon", "service", "manager", "systemd",
            "dbus", "udev", "kernel", "polkit", "sudo",
            "gvfs", "udisks", "upower", "bluetooth", "pulse",
            "network", "nm-", "wifi", "ethernet"
        ]
        
        return systemIndicators.some(indicator => 
            appName.includes(indicator) || desktopEntry.includes(indicator)
        ) || 
        // Also check if it has no desktop entry (often system notifications)
        (!notification.desktopEntry && appName.length < 10)
    }

    getFilteredNotifications(
        notifications: StoredNotification[], 
        filter: NotificationFilter
    ): StoredNotification[] {
        let filtered = notifications.filter(n => !n.dismissed)

        if (filter.showOnlyUnread) {
            filtered = filtered.filter(n => !n.read)
        }

        if (filter.allowedApps) {
            filtered = filtered.filter(n => 
                filter.allowedApps!.includes(n.notification.appName || "")
            )
        }

        if (filter.blockedApps) {
            filtered = filtered.filter(n => 
                !filter.blockedApps!.includes(n.notification.appName || "")
            )
        }

        if (filter.timeRange) {
            filtered = filtered.filter(n => 
                n.timestamp >= filter.timeRange!.start && 
                n.timestamp <= filter.timeRange!.end
            )
        }

        return filtered
    }
} 