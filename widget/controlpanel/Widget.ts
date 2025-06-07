import { Astal } from "astal/gtk3"
import { createWindowManager } from "../utils"
import ControlPanel from "./components/ControlPanel"

export const controlPanel = createWindowManager({
  name: "control-panel",
  className: "control-panel-window",
  content: ControlPanel(),
  anchor: Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT,
  globalToggleName: "toggleControlPanel",
}) 