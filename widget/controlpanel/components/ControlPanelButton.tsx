import { bind } from "astal"
import { controlPanelVisible, toggleControlPanel } from "../Service"

export default function ControlPanelButton() {
  return (
    <button
      widthRequest={30}
      className={bind(controlPanelVisible).as(visible => 
        `control-panel-button ${visible ? 'active' : ''}`
      )}
      onClicked={toggleControlPanel}
      tooltip_text="Control Panel"
    >
      <icon icon="view-grid-symbolic" />
    </button>
  )
} 