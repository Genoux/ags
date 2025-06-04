import { Astal, Gtk, Gdk } from "astal/gtk3"
import { bind, Variable, timeout } from "astal"
import Notifd from "gi://AstalNotifd"
import NotificationItem from "./NotificationItem"
import { notificationStore } from "../store"

interface PopupNotification {
    id: number
    notification: Notifd.Notification
    timestamp: number
    timeoutId?: any
    state: 'appearing' | 'visible'
}

// Variable to track active popup notifications
const activePopups = Variable<PopupNotification[]>([])

// Get the Notifd instance
const notifd = Notifd.get_default()

// Function to add a notification popup
function addPopup(notification: Notifd.Notification) {
    if (activePopups.get().some(p => p.id === notification.id)) return
    
    const popup: PopupNotification = {
        id: notification.id,
        notification,
        timestamp: Date.now(),
        state: 'appearing'
    }
    
    // Add to the top of the stack
    activePopups.set([popup, ...activePopups.get()])
    
    // Fade in animation - transition to visible state
    timeout(50, () => {
        const popups = activePopups.get()
        const popupIndex = popups.findIndex(p => p.id === popup.id)
        if (popupIndex !== -1) {
            popups[popupIndex].state = 'visible'
            activePopups.set([...popups])
        }
    })
    
    // Start auto-dismiss timer
    startAutoDismissTimer(popup.id)
}

// Function to start auto-dismiss timer
function startAutoDismissTimer(id: number) {
    const timeoutId = timeout(5000, () => {
        removePopup(id)
    })
    
    // Update the popup with timeout ID
    const popups = activePopups.get()
    const popupIndex = popups.findIndex(p => p.id === id)
    if (popupIndex !== -1) {
        popups[popupIndex].timeoutId = timeoutId
        activePopups.set([...popups])
    }
}

// Function to remove a notification popup (only from popup, not from store)
function removePopup(id: number) {
    const popups = activePopups.get()
    const popup = popups.find(p => p.id === id)
    if (popup && popup.timeoutId) {
        clearTimeout(popup.timeoutId)
    }
    activePopups.set(popups.filter(p => p.id !== id))
}

// Function to dismiss all popup notifications
export function dismissAllPopups() {
    const popups = activePopups.get()
    // Clear all timeouts
    popups.forEach(popup => {
        if (popup.timeoutId) {
            clearTimeout(popup.timeoutId)
        }
    })
    // Clear all popups
    activePopups.set([])
}

// Listen directly to Notifd for new notifications
notifd.connect("notified", (_, id) => {
    const notification = notifd.get_notification(id)
    if (notification && notification.summary?.trim()) {
        addPopup(notification)
    }
})

// Listen for resolved notifications and remove from popups
notifd.connect("resolved", (_, id) => {
    removePopup(id)
})

export default function NotificationPopups() {
    return (
        <window
            className="NotificationPopups"
            name="notification-popups"
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
            layer={Astal.Layer.OVERLAY}
            exclusivity={Astal.Exclusivity.IGNORE}
            keymode={Astal.Keymode.NONE}
            margin_top={10}
            margin_right={6}
            margin_bottom={42}
            visible={bind(activePopups).as(popups => popups.length > 0)}>
            
            <box 
                className="popup-stack" 
                vertical 
                spacing={2}>
                {bind(activePopups).as((popups: PopupNotification[]) => 
                    popups.map((popup, index) => {
                        let opacity = 1
                        
                        if (popup.state === 'appearing') {
                            opacity = 0
                        } else {
                            // Stack opacity effect for multiple notifications
                            opacity = Math.max(0.8, 1 - (index * 0.05))
                        }
                        
                        return (
                            <box
                                className="popup-notification"
                                css={`
                                    opacity: ${opacity};
                                    margin-top: ${index * 2}px;
                                    transition: opacity 1000ms ease-out;
                                `}>
                                <NotificationItem
                                    notification={popup.notification}
                                    timestamp={popup.timestamp}
                                    showActions={true}
                                    onDismiss={() => {
                                        // Only remove from popup, keep in notification center
                                        removePopup(popup.id)
                                    }}
                                    onMarkRead={() => {
                                        // Remove from popup and mark as read in store
                                        removePopup(popup.id)
                                        notificationStore.markAsRead(popup.id)
                                    }}
                                    onActionClick={() => {
                                        // Remove from popup and dismiss from store
                                        removePopup(popup.id)
                                        notificationStore.dismiss(popup.id)
                                    }}
                                />
                            </box>
                        )
                    })
                )}
            </box>
        </window>
    )
} 