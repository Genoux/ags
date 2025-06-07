import { bind, Variable } from "astal"
import { Astal, Gdk, Gtk, App } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"
import Notification from "./Notification"
import { filterVisibleNotifications } from "./utils"

const notifications = Notifd.get_default()

// Simple notification list component
function NotificationList() {
    return (
        <box className="notification-list" vertical vexpand>
            {bind(notifications, "notifications").as(notifs => {
                const visibleNotifs = filterVisibleNotifications(notifs)
                    .sort((a: any, b: any) => b.time - a.time) // Sort by time, newest first
                
                if (visibleNotifs.length === 0) {
                    // Empty state
                    return (
                        <box 
                            className="empty-state" 
                            vertical 
                            halign={Gtk.Align.CENTER}
                            valign={Gtk.Align.CENTER}
                            vexpand
                            spacing={10}
                        >
                            <icon 
                                className="empty-state-icon"
                                icon="mail-read-symbolic" 
                                pixel_size={48}
                            />
                            <label 
                                className="empty-state-subtitle"
                                label="You're all caught up!"
                            />
                        </box>
                    )
                }
                
                return visibleNotifs.map(notif => (
                    <Notification notification={notif} isInCenter={true} />
                ))
            })}
        </box>
    )
}

// Simple notification center
export default function NotificationCenter() {
    const visible = Variable(false)
    
    const window = (
        <window
            className="NotificationCenter"
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.BOTTOM}
            exclusivity={Astal.Exclusivity.IGNORE}
            keymode={Astal.Keymode.ON_DEMAND}
            visible={bind(visible)}
            vexpand
            onKeyPressEvent={(_, event) => {
                if (event.get_keyval()[1] === Gdk.KEY_Escape) {
                    visible.set(false)
                }
            }}
        >
            <box className="notification-center-container" vertical>
                <box className="header">
                    <label className="title" label="Notifications" hexpand halign={Gtk.Align.START} />
                    <button 
                        className="close-btn"
                        halign={Gtk.Align.END}
                        onClicked={() => visible.set(false)}
                    >
                        <icon icon="window-close-symbolic" />
                    </button>
                </box>
                
                <scrollable 
                    hscroll={Gtk.PolicyType.NEVER}
                    vscroll={Gtk.PolicyType.AUTOMATIC}
                >
                    <NotificationList />
                </scrollable>
                
                <box className="header">
                    <button 
                        className="clear-all-btn"
                        onClicked={() => {
                            notifications.get_notifications().forEach(n => n.dismiss())
                        }}
                    >
                        <label label="Clear All" />
                    </button>
                </box>
            </box>
        </window>
    )
    
    // Attach toggle function to the window
    ;(window as any).toggle = () => visible.set(!visible.get())
    
    return window
}

// Export widget version for embedding in other components (like ControlPanel)
export function NotificationCenterWidget() {
    return (
        <box className="notification-center-container" vertical>
            <box className="header">
                <label className="title" label="Notifications" hexpand halign={Gtk.Align.START} />
                <button 
                    className="clear-all-btn"
                    onClicked={() => {
                        notifications.get_notifications().forEach(n => n.dismiss())
                    }}
                >
                    <label label="Clear All" />
                </button>
            </box>
            
            <scrollable 
                hscroll={Gtk.PolicyType.NEVER}
                vscroll={Gtk.PolicyType.AUTOMATIC}
            >
                <NotificationList />
            </scrollable>
        </box>
    )
}
