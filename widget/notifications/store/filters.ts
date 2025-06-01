import Notifd from "gi://AstalNotifd"
import { StoredNotification, NotificationFilter } from "./types"
import { NotificationStoreConfig } from "./config"

export class NotificationFilters {
    constructor(private config: Required<NotificationStoreConfig>) {}

    shouldIgnoreNotification(notification: Notifd.Notification): boolean {
        const appName = notification.appName?.toLowerCase() || ""
        const desktopEntry = notification.desktopEntry?.toLowerCase() || ""
        
        // Only filter very specific system noise
        const matchedIgnoredApp = this.config.ignoredApps.find(app => 
            appName.includes(app) || desktopEntry.includes(app)
        )
        if (matchedIgnoredApp) {
            return true
        }

        // Check ignored categories (now empty by default)
        if (notification.category && this.config.ignoredCategories.includes(notification.category)) {
            return true
        }

        // Only filter completely empty notifications
        if (!notification.summary?.trim() && !notification.body?.trim()) {
            return true
        }

        return false
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