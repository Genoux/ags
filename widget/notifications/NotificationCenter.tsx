import { Astal, Gtk, Gdk } from "astal/gtk3"
import { bind, Variable } from "astal"
import { notificationStore } from "./store"
import type { GroupedNotification } from "./store"
import NotificationItem from "./components/NotificationItem"
import { createWindowManager } from "../WindowHelper"

// Global variable to control visibility
export const notificationCenterVisible = Variable(false)

function NotificationCenterHeader() {
    return (
        <box className="header">
            <label 
                className="title"
                label="Notifications"
                halign={Gtk.Align.START}
            />
            <box hexpand />
            
            <label 
                className="count"
                label={bind(notificationStore.unreadCount).as((count: number) => 
                    count > 0 ? `${count} unread` : "No new notifications"
                )}
            />
            
            <button 
                className="clear-all-btn"
                tooltip_text="Clear all notifications"
                onClicked={() => notificationStore.dismissAll()}>
                <label label="Clear All" />
            </button>
            
            <button 
                className="close-btn"
                tooltip_text="Close notification center"
                onClicked={() => notificationCenterVisible.set(false)}>
                <icon icon="window-close-symbolic" />
            </button>
        </box>
    )
}

function NotificationList() {
    return (
        <scrollable
            className="notification-list"
            vexpand
            hscroll={Gtk.PolicyType.NEVER}
            vscroll={Gtk.PolicyType.AUTOMATIC}>
            <box vertical>
                {bind(notificationStore.groupedNotifications).as((groups: GroupedNotification[]) => {
                    if (groups.length === 0) {
                        return (
                            <box className="empty-state">
                                <icon icon="notifications-disabled-symbolic" />
                                <label label="No notifications" />
                            </box>
                        )
                    }
                    
                    return groups.map((group: GroupedNotification) => {
                        const { latestNotification, count, appName } = group
                        
                        const displaySummary = count > 1 
                            ? `${latestNotification.notification.appName} (${count})`
                            : undefined
                            
                        const displayBody = count > 1 
                            ? `${latestNotification.notification.body} (and ${count - 1} more)`
                            : undefined
                        
                        return (
                            <NotificationItem
                                notification={latestNotification.notification}
                                timestamp={latestNotification.timestamp}
                                isRead={latestNotification.read}
                                displaySummary={displaySummary}
                                displayBody={displayBody}
                                onDismiss={() => {
                                    if (count === 1) {
                                        notificationStore.dismiss(latestNotification.id)
                                    } else {
                                        notificationStore.dismissAllFromApp(appName)
                                    }
                                }}
                                onMarkRead={() => {
                                    if (count === 1) {
                                        notificationStore.markAsRead(latestNotification.id)
                                    } else {
                                        notificationStore.markAppAsRead(appName)
                                    }
                                }}
                                onActionClick={() => {
                                    // When an action is clicked, the notification should be dismissed
                                    // This happens automatically via the "resolved" signal, but we can add
                                    // additional logic here if needed (like closing the notification center)
                                    console.log("Action clicked in notification center for:", latestNotification.notification.appName)
                                    
                                    // Force dismiss after a short delay if the automatic signal doesn't work
                                    setTimeout(() => {
                                        // Check if the notification is still in the store
                                        const notifications = notificationStore.notifications.get()
                                        const stillExists = notifications.find(n => n.id === latestNotification.id && !n.dismissed)
                                        
                                        if (stillExists) {
                                            console.log("Notification still exists after action, force dismissing:", latestNotification.id)
                                            notificationStore.dismiss(latestNotification.id)
                                        }
                                    }, 200)
                                    
                                    notificationCenterVisible.set(false)
                                }}
                            />
                        )
                    })
                })}
            </box>
        </scrollable>
    )
}

// Create the window manager
const notificationCenterManager = createWindowManager({
    name: "NotificationCenter",
    className: "NotificationCenter",
    content: (
        <box className="notification-center-container" vertical>
            <NotificationCenterHeader />
            <NotificationList />
        </box>
    ),
    anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT,
    closeOnClickOutside: true, 
    globalToggleName: "toggleNotificationCenter"
})

// Sync the window manager visibility with our variable
notificationCenterVisible.subscribe(() => {
    if (notificationCenterVisible.get()) {
        notificationCenterManager.show()
    } else {
        notificationCenterManager.hide()
    }
})

export default function NotificationCenter(gdkmonitor: Gdk.Monitor) {
    return notificationCenterManager.createWindow()
} 