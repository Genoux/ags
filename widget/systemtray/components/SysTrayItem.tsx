import { getItemName } from "../Service"

export default function SysTrayItem({ item }: { item: any }) {
  return (
    <button
      className="systray-item"
      tooltip_text={item.tooltip_markup}
      onClicked={() => {
        try {
          item.activate(0, 0)
        } catch (error) {
          console.error("Failed to activate tray item:", error)
        }
      }}
    >
      <icon gicon={item.gicon} />
    </button>
  )
}