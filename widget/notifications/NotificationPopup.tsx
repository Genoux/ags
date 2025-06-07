import { bind, Variable, timeout } from "astal"
import { Astal, Gdk, Gtk, App } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"
import Notification from "./Notification"
import { filterPopupNotifications } from "./utils"

const notifications = Notifd.get_default()
const dismissedPopups = Variable<number[]>([]) // Track dismissed popup notifications

// Track when AGS started to only show new notifications in popup
const agsStartTime = Date.now() / 1000

// Function to dismiss a popup notification
export function dismissPopupNotification(notifId: number) {
    const current = dismissedPopups.get()
    if (!current.includes(notifId)) {
        dismissedPopups.set([...current, notifId])
    }
}

// Combine notifications and dismissed list reactively
const visiblePopupNotifications = Variable.derive([
    bind(notifications, "notifications"),
    dismissedPopups
], (notifs, dismissed) => 
    filterPopupNotifications(notifs) // Filter out completely ignored apps
        .filter(notif => notif.time > agsStartTime) // Only show notifications that arrived after AGS started
        .filter(notif => !dismissed.includes(notif.id)) // Hide dismissed popups
        .sort((a: any, b: any) => b.time - a.time) // Sort by time, newest first
        .slice(0, 10) // Limit to 3 notifications max
)

// Simple notification popup for floating notifications
export default function NotificationPopup(gdkmonitor: Gdk.Monitor) {
    return (
        <window
            className="NotificationPopup"
            gdkmonitor={gdkmonitor}
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
            keymode={Astal.Keymode.NONE}
            layer={Astal.Layer.OVERLAY}
            application={App}
        >
            <box className="notification-popup-container" vertical spacing={8}>
                {bind(visiblePopupNotifications).as(notifs => 
                    notifs.map(notif => (
                        <Notification notification={notif} isInCenter={false} />
                    ))
                )}
            </box>
        </window>
    )
} 