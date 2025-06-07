import { bind } from "astal"
import { mediaPlayer, hasMediaPlayers } from "../../mediaplayer"
import { audioControls } from "../../audiocontrols"
import { NotificationCenterWidget } from "../../notifications"
import { SystemControl } from "../../systemcontrol"

export default function ControlPanel() {
  return (
    <box className="ControlPanel" vertical spacing={8} hexpand>
      <box className="notification-section">
        <NotificationCenterWidget />
      </box>
      <box className="system-control-section">
        <SystemControl />
      </box>
      <box className="audio-section">{audioControls.content}</box>
      <box className="media-section" visible={bind(hasMediaPlayers).as((visible) => visible)}>
        {mediaPlayer.content}
      </box>
    </box>
  )
} 