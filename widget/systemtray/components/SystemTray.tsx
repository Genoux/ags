import { bind } from "astal"
import { SystemTray, shouldIgnoreTrayItem } from "../Service"
import SysTrayItem from "./SysTrayItem"

// UI Component - 100% Pure UI
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