import { createWindowManager } from "../utils"
import AudioControlsComponent from "./components/AudioControls"

// Create window manager with MPRIS integration
export const audioControls = createWindowManager({
    name: "audio-control",
    className: "audio-control-window", 
    content: AudioControlsComponent(),
    globalToggleName: "toggleAudioControl"
}) 