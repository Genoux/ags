import { bind } from "astal"
import { GLib } from "astal"
import Tray from "gi://AstalTray"

const SystemTray = Tray.get_default()

// Apps to ignore in system tray
const IGNORED_TRAY_APPS = [
  "clickup"
]

/**
 * Get app name from tray item using multiple sources
 */
function getItemName(item: any): string {
  // Priority order: title -> tooltip_markup -> id
  const title = item.title?.trim()
  const tooltip = item.tooltip_markup?.trim()
  const id = item.id?.trim()
  
  return title || tooltip || id || "unknown"
}


/**
 * Check if tray item should be ignored
 */
function shouldIgnoreTrayItem(item: any): boolean {
  const name = getItemName(item).toLowerCase()
  const id = (item.id || "").toString().toLowerCase()
  
  return IGNORED_TRAY_APPS.some(app =>
    name.includes(app) || id.includes(app)
  )
}

/**
 * Focus window by app class/title
 */
async function focusWindow(appName: string): Promise<boolean> {
  if (!appName || appName === "unknown") return false
  
  try {
    const [success, output] = GLib.spawn_command_line_sync("hyprctl clients -j")
    if (!success || !output) return false
    
    const clients = JSON.parse(new TextDecoder().decode(output))
    const searchTerm = appName.toLowerCase()
    
    for (const client of clients) {
      const clientClass = client.class?.toLowerCase() || ""
      const clientTitle = client.title?.toLowerCase() || ""
      
      // Enhanced matching for different app name patterns
      const isMatch = (
        clientClass.includes(searchTerm) ||
        clientTitle.includes(searchTerm)
      )
      
      if (isMatch) {
        GLib.spawn_command_line_async(`hyprctl dispatch focuswindow address:${client.address}`)
        return true
      }
    }
    return false
  } catch (error) {
    console.error("focusWindow error:", error)
    return false
  }
}

/**
 * Individual tray item component
 */
function SysTrayItem({ item }: { item: any }) {
  const appName = getItemName(item)
  const tooltipText = item.tooltip_markup || appName || "Tray Item"
  
  
  return (
    <button
      className="systray-item"
      tooltip_markup={tooltipText}
      onClicked={async () => {
        // Try to focus existing window first
        const focused = await focusWindow(appName)
        if (!focused) {
          try {
            item.activate(0, 0)
          } catch (error) {
            console.error("Error activating tray item:", error)
          }
        }
      }}
    >
      <icon 
          icon={appName}
          className="tray-icon" 
        />
    
    </button>
  )
}

/**
 * Main system tray component
 */
export default function SystemTrayWidget() {
  return (
    <box className="system-tray">
      {bind(SystemTray, "items").as(items => {
        // Filter out ignored apps and map to components
        const filteredItems = items.filter((item: any) => !shouldIgnoreTrayItem(item))
        
        return filteredItems.map((item: any, index: number) => (
          <SysTrayItem item={item} />
        ))
      })}
    </box>
  )
}