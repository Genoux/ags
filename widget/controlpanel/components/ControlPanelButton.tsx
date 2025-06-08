import { bind } from "astal"
import { controlPanelVisible, toggleControlPanel } from "../Service"

export default function ControlPanelButton() {
  return (
    <button
      className={bind(controlPanelVisible).as((visible) =>
        visible ? "active" : ""
      )}
      onClicked={toggleControlPanel}
    >
      <icon icon="view-grid-symbolic" />
    </button>
  )
} 