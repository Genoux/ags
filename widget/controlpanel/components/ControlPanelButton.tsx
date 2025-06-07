import { bind } from "astal"
import { controlPanel } from "../Widget"

export default function ControlPanelButton() {
  return (
    <button
      className={bind(controlPanel.isVisible).as((visible) =>
        visible ? "active" : ""
      )}
      onClicked={() => {
        controlPanel.toggle()
      }}
    >
      <icon icon="view-grid-symbolic" />
    </button>
  )
} 