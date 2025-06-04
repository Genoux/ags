import { Gtk } from "astal/gtk3"
import { bind } from "astal"
import { notificationStore } from "./store"
import { NotificationButtonProps } from "./types"
import { notificationCenterVisible } from "./NotificationCenter"

export default function NotificationButton({ 
    className = "", 
    showCount = true
}: NotificationButtonProps) {
    return (
        <button
            className={`NotificationButton ${className} ${bind(notificationStore.totalCount).as((count: number) => count > 0 ? "has-notifications" : "")}`}
            onClicked={() => {
                notificationCenterVisible.set(!notificationCenterVisible.get())
            }}>
            <box halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
                <icon 
                    className="notification-icon"
                    icon={bind(notificationStore.totalCount).as((count: number) => 
                        count > 0 ? "notification-symbolic" : "notification-disabled-symbolic"
                    )}
                />
                
                {/* Total count badge */}
                {showCount && (
                    <box 
                        className="badge-container"
                        halign={Gtk.Align.START}
                        valign={Gtk.Align.START}
                        visible={bind(notificationStore.totalCount).as((count: number) => count > 0)}>
                        <label 
                            className="badge"
                            halign={Gtk.Align.CENTER}
                            valign={Gtk.Align.CENTER}
                            label={bind(notificationStore.totalCount).as((count: number) => 
                                count > 99 ? "99+" : count.toString()
                            )}
                        />
                    </box>
                )}
            </box>
        </button>
    )
} 