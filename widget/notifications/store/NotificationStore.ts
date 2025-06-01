import { Variable } from "astal"
import Notifd from "gi://AstalNotifd"
import { StoredNotification, GroupedNotification, NotificationFilter } from "./types"
import { NotificationStoreConfig, DEFAULT_CONFIG } from "./config"
import { NotificationFilters } from "./filters"
import { NotificationGrouping } from "./grouping"

class NotificationStore {
    private notifd = Notifd.get_default()
    private storedNotifications: StoredNotification[] = []
    private config: Required<NotificationStoreConfig>
    private filters: NotificationFilters
    private grouping: NotificationGrouping
    private dismissedIds = new Set<number>()
    
    // Reactive state with proper typing
    public notifications = Variable<StoredNotification[]>([])
    public groupedNotifications = Variable<GroupedNotification[]>([])
    public unreadCount = Variable<number>(0)
    public totalCount = Variable<number>(0)
    public activeFilter = Variable<NotificationFilter>({})
    public recentNotifications = Variable<StoredNotification[]>([])
    public pinnedNotifications = Variable<StoredNotification[]>([])

    constructor(config: NotificationStoreConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.filters = new NotificationFilters(this.config)
        this.grouping = new NotificationGrouping(this.filters)
        
        this.loadDismissedIds()
        this.setupNotificationListeners()
        this.loadExistingNotifications()
        this.setupCleanupTimer()
    }

    // =========================================================================
    // Setup Methods
    // =========================================================================

    private setupNotificationListeners(): void {
        this.notifd.connect("notified", (_, id) => {
            try {
                const notification = this.notifd.get_notification(id)
                if (notification) this.add(notification)
            } catch (error) {
                console.error("Error adding notification:", error)
            }
        })

        this.notifd.connect("resolved", (_, id) => {
            try {
                // Use internal flag to prevent recursion
                this.dismiss(id, true)
            } catch (error) {
                console.error("Error dismissing notification:", error)
            }
        })
    }

    private loadExistingNotifications(): void {
        try {
            this.notifd.get_notifications().forEach(n => this.add(n))
        } catch (error) {
            console.error("Error loading notifications:", error)
        }
    }

    private setupCleanupTimer(): void {
        setInterval(() => this.cleanupOldNotifications(), this.config.autoCleanupInterval)
    }

    private loadDismissedIds(): void {
        try {
            const dismissedFile = "/tmp/ags-dismissed-notifications"
            // In a real implementation, you'd use proper file I/O
            // For now, just keep in memory
        } catch (error) {
            console.error("Error loading dismissed IDs:", error)
        }
    }

    private saveDismissedIds(): void {
        try {
            // In a real implementation, you'd save to file
            // For now, just keep in memory  
        } catch (error) {
            console.error("Error saving dismissed IDs:", error)
        }
    }

    // =========================================================================
    // State Management
    // =========================================================================

    private updateReactiveState(): void {
        const activeNotifications = this.storedNotifications.filter(n => !n.dismissed)
        
        const currentTotalCount = this.totalCount.get()
        const newTotalCount = activeNotifications.length
        const currentUnreadCount = this.unreadCount.get()
        const newUnreadCount = activeNotifications.filter(n => !n.read).length
        
        // Only update if values actually changed to prevent infinite loops
        if (currentTotalCount !== newTotalCount) {
            this.totalCount.set(newTotalCount)
        }
        
        if (currentUnreadCount !== newUnreadCount) {
            this.unreadCount.set(newUnreadCount)
        }
        
        // Always update these as they contain object references
        this.notifications.set([...activeNotifications])
        this.groupedNotifications.set(this.grouping.groupNotifications(
            this.storedNotifications, 
            this.activeFilter.get()
        ))
        
        // Update recent notifications (last 10)
        const recent = activeNotifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10)
        this.recentNotifications.set(recent)
        
        // Update pinned notifications
        this.pinnedNotifications.set(activeNotifications.filter(n => n.pinned))
    }

    // =========================================================================
    // Public API Methods
    // =========================================================================

    public add(notification: Notifd.Notification): void {
        // Don't add if already dismissed
        if (this.dismissedIds.has(notification.id)) {
            return
        }
        
        if (this.filters.shouldIgnoreNotification(notification)) {
            return
        }

        const stored: StoredNotification = {
            id: notification.id,
            notification,
            timestamp: Date.now(),
            read: false,
            dismissed: false
        }

        // Remove existing notification with same ID if it exists
        const existingIndex = this.storedNotifications.findIndex(n => n.id === notification.id)
        if (existingIndex !== -1) {
            this.storedNotifications[existingIndex] = stored
        } else {
            this.storedNotifications.push(stored)
        }

        // Cleanup if we exceed max stored notifications
        if (this.storedNotifications.length > this.config.maxStoredNotifications) {
            this.storedNotifications = this.storedNotifications
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, this.config.maxStoredNotifications)
        }

        this.updateReactiveState()
    }

    public dismiss(id: number, internal: boolean = false): void {
        const notification = this.storedNotifications.find(n => n.id === id)
        if (notification) {
            notification.dismissed = true
            this.dismissedIds.add(id)
            this.saveDismissedIds()
            
            // Only dismiss the actual notification object if this is NOT from the "resolved" signal
            // to prevent recursion
            if (!internal) {
                try {
                    notification.notification.dismiss()
                } catch (error) {
                    console.error("Error dismissing notification:", error)
                }
            }
            
            this.updateReactiveState()
        }
    }

    public dismissAllFromApp(appName: string): void {
        const notificationsToDissmiss = this.storedNotifications
            .filter(n => n.notification.appName === appName && !n.dismissed)
        
        // Mark all as dismissed first in our store
        notificationsToDissmiss.forEach(n => {
            n.dismissed = true
            this.dismissedIds.add(n.id)
        })
        
        this.saveDismissedIds()
        this.updateReactiveState()
        
        // Then dismiss them from Notifd with spacing to prevent crashes
        notificationsToDissmiss.forEach((n, index) => {
            setTimeout(() => {
                try {
                    n.notification.dismiss()
                } catch (error) {
                    console.error("Error dismissing notification:", error)
                }
            }, index * 25) // 50ms delay between each dismiss
        })
    }

    public dismissAll(): void {
        const notificationsToDissmiss = this.storedNotifications.filter(n => !n.dismissed)
        
        // Mark all as dismissed first in our store
        notificationsToDissmiss.forEach(n => {
            n.dismissed = true
            this.dismissedIds.add(n.id)
        })
        
        this.saveDismissedIds()
        this.updateReactiveState()
        
        // Then dismiss them from Notifd with spacing to prevent crashes
        notificationsToDissmiss.forEach((n, index) => {
            setTimeout(() => {
                try {
                    n.notification.dismiss()
                } catch (error) {
                    console.error("Error dismissing notification:", error)
                }
            }, index * 25) // 50ms delay between each dismiss
        })
    }

    public markAsRead(id: number): void {
        const notification = this.storedNotifications.find(n => n.id === id)
        if (notification) {
            notification.read = true
            this.updateReactiveState()
        }
    }

    public markAppAsRead(appName: string): void {
        this.storedNotifications
            .filter(n => n.notification.appName === appName)
            .forEach(n => n.read = true)
        this.updateReactiveState()
    }

    public pinNotification(id: number): void {
        const notification = this.storedNotifications.find(n => n.id === id)
        if (notification) {
            notification.pinned = !notification.pinned
            this.updateReactiveState()
        }
    }

    public setFilter(filter: NotificationFilter): void {
        this.activeFilter.set(filter)
        this.updateReactiveState()
    }

    public clearFilter(): void {
        this.activeFilter.set({})
        this.updateReactiveState()
    }

    private cleanupOldNotifications(): void {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const before = this.storedNotifications.length
        
        this.storedNotifications = this.storedNotifications.filter(n => 
            n.timestamp > oneWeekAgo || n.pinned || !n.dismissed
        )
        
        if (this.storedNotifications.length !== before) {
            this.updateReactiveState()
        }
    }
}

// Export singleton instance
export default new NotificationStore() 