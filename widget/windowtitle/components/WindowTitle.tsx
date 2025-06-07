import { bind } from "astal"
import { hypr, updateTrigger } from "../Widget"

// UI Component - 100% Pure UI
export default function WindowTitle() {
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