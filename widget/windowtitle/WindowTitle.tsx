import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable } from "astal"
import Hyprland from "gi://AstalHyprland"
import { getAppIcon } from "../utils"

export default function WindowTitle() {
  const hypr = Hyprland.get_default()
  const updateTrigger = Variable(0)
  let titleSignalId: number | null = null

  function triggerUpdate() {
    updateTrigger.set(updateTrigger.get() + 1)
  }

  // Listen to window focus events
  hypr.connect("notify::focused-client", () => {
    // Clean up previous listener
    if (titleSignalId !== null && hypr.focusedClient) {
      hypr.focusedClient.disconnect(titleSignalId)
      titleSignalId = null
    }

    const currentClient = hypr.focusedClient
    if (currentClient) {
      titleSignalId = currentClient.connect("notify::title", triggerUpdate)
    }
    triggerUpdate()
  })

  // Listen to client changes
  hypr.connect("client-added", triggerUpdate)
  hypr.connect("client-removed", triggerUpdate)

  return (
    <box className="window-title">
      {bind(updateTrigger).as(() => {
        const focusedClient = hypr.focusedClient
        
        if (!focusedClient) {
          return (
            <box spacing={8}>
              <icon icon="desktop-symbolic" />
              <label label="Desktop" />
            </box>
          )
        }

        const title = focusedClient.title || "Unknown"
        const appClass = focusedClient.class || "unknown"
        const displayText = title.length > 50 ? title.substring(0, 47) + "..." : title

        return (
          <box spacing={4}>
              <icon icon={appClass} />
            <label
              label={displayText}
              tooltip_text={`${focusedClient.class}: ${title}`}
              ellipsize={3}
            />
          </box>
        )
      })}
    </box>
  )
}