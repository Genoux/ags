import { StoredNotification, GroupedNotification, NotificationFilter } from "./types"
import { NotificationFilters } from "./filters"

export class NotificationGrouping {
    constructor(private filters: NotificationFilters) {}

    groupNotifications(
        notifications: StoredNotification[], 
        activeFilter: NotificationFilter
    ): GroupedNotification[] {
        const filteredNotifications = this.filters.getFilteredNotifications(notifications, activeFilter)
        const grouped = new Map<string, StoredNotification[]>()

        filteredNotifications.forEach(notification => {
            const appName = notification.notification.appName || "Unknown"
            if (!grouped.has(appName)) {
                grouped.set(appName, [])
            }
            grouped.get(appName)!.push(notification)
        })

        return Array.from(grouped.entries()).map(([appName, notifications]) => {
            const sortedNotifications = notifications.sort((a, b) => b.timestamp - a.timestamp)
            const latestNotification = sortedNotifications[0]
            
            return {
                appName,
                notifications: sortedNotifications,
                latestNotification,
                count: notifications.length,
                hasUnread: notifications.some(n => !n.read)
            }
        })
    }
} 