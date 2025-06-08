import { Astal } from "astal/gtk3"
import { createSimpleWindow } from "../utils"
import ControlPanel from "./components/ControlPanel"

// Create simple popup window
export const controlPanel = createSimpleWindow({
  name: "control-panel",
  className: "control-panel-window",
  content: ControlPanel(),
  anchor: Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT,
})

// Export what components need
export const controlPanelVisible = controlPanel.isVisible
export const toggleControlPanel = controlPanel.toggle 