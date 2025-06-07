import { getItemName, focusWindow } from "../Widget"

// UI Component - Individual Tray Item
export default function SysTrayItem({ item }: { item: any }) {
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