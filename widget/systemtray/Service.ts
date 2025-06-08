import { GLib } from "astal"
import Tray from "gi://AstalTray"

// Widget Logic - 100% State & Business Logic
export const SystemTray = Tray.get_default()

// Apps to ignore in system tray
export const IGNORED_TRAY_APPS = [
  "clickup",
  "unknown"
]

/**
 * Get app name from tray item using multiple sources
 */
export function getItemName(item: any): string {
  // Priority order: title -> tooltip_markup -> id
  const title = item.title?.trim()
  const tooltip = item.tooltip_markup?.trim()
  const id = item.id?.trim()
  
  return title || tooltip || id || "unknown"
}

/**
 * Check if tray item should be ignored
 */
export function shouldIgnoreTrayItem(item: any): boolean {
  const name = getItemName(item).toLowerCase()
  const id = (item.id || "").toString().toLowerCase()
  
  return IGNORED_TRAY_APPS.some(app =>
    name.includes(app) || id.includes(app)
  )
}

/**
 * Focus window by app class/title
 */
export async function focusWindow(appName: string): Promise<boolean> {
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

      GLib.spawn_command_line_async(`hyprctl dispatch exec ${appName}`)
    }
    return false
  } catch (error) {
    console.error("focusWindow error:", error)
    return false
  }
}