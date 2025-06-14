import { bind } from "astal"
import { SystemTray } from "../Service"
import SysTrayItem from "./SysTrayItem"

export default function SystemTrayWidget() {
  return (
    <box className="system-tray" spacing={4}>
      {bind(SystemTray, "items").as(items => 
        items.map(item => <SysTrayItem item={item} />)
      )}
    </box>
  )
}