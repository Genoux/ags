import Notifd from "gi://AstalNotifd"

export interface StoredNotification {
    id: number
    notification: Notifd.Notification
    timestamp: number
    read: boolean
    dismissed: boolean
    pinned?: boolean
}

export interface GroupedNotification {
    appName: string
    notifications: StoredNotification[]
    latestNotification: StoredNotification
    count: number
    hasUnread: boolean
}

export interface NotificationFilter {
    allowedApps?: string[]
    blockedApps?: string[]
    showOnlyUnread?: boolean
    timeRange?: {
        start: number
        end: number
    }
} 