import { getItemName, focusWindow } from "../Service"
import { GLib } from "astal"

// UI Component - Individual Tray Item
export default function SysTrayItem({ item }: { item: any }) {
  const appName = getItemName(item)
  const tooltipText = item.tooltip_markup || appName || "Tray Item"
  
  return (
    <button
      className="systray-item"
      tooltip_markup={tooltipText}
      onClicked={async () => {
       await focusWindow(appName)
      }}
    >
      <icon 
          icon={appName}
          className="tray-icon" 
        />
    </button>
  )
} 