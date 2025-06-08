import { bind } from "astal"
import { Gtk } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"
import { getCountableNotificationCount, notificationCenter } from "../Service"

const notifications = Notifd.get_default()

export default function NotificationButton() {
  return (
    <button
      className={bind(notifications, "notifications").as(notifs => {
        const count = getCountableNotificationCount(notifs)
        return `NotificationButton${count > 0 ? " has-notifications" : ""}`
      })}
      tooltip_text="Notifications"
      onClicked={notificationCenter.toggle}
    >
      <box spacing={4}>
        <icon
          className="notification-icon"
          icon={"notification"}
        />
        <box
          className="badge"
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          visible={bind(notifications, "notifications").as(notifs => {
            const count = getCountableNotificationCount(notifs)
            return count > 0
          })}
        >
          <label label={bind(notifications, "notifications").as(notifs => {
            const count = getCountableNotificationCount(notifs)
            return `${count}`
          })} />
        </box>
      </box>
    </button>
  )
} 