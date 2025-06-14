import Tray from "gi://AstalTray"

export const SystemTray = Tray.get_default()

export function getItemName(item: any): string {
  return item.title || item.id || "Tray Item"
}

export function hasItems(): boolean {
  return SystemTray.get_items().length > 0
}