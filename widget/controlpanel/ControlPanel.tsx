import { Astal, Gtk, Widget } from "astal/gtk3";
import { mediaPlayer, hasMediaPlayers } from "../mediaplayer";
import { audioControls } from "../audiocontrols";
import { bind } from "astal";
import { createWindowManager } from "../WindowHelper";
import { NotificationCenterWidget } from "../notifications"
import SystemControl from "../systemcontrol"

const controlPanel = createWindowManager({
  name: "control-panel",
  className: "control-panel-window",
  content: ControlPanel(),
  anchor: Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT,
  globalToggleName: "toggleControlPanel",
});

// Main export - can return individual widgets or combined
function ControlPanel() {
  return (
    <box className="ControlPanel" vertical spacing={4}>
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
  );
}

export default function ControlPanelButton() {
  return (
    <button
      className={bind(controlPanel.isVisible).as((visible) =>
        visible ? "active" : ""
      )}
      onClicked={() => {
        controlPanel.toggle();
      }}
    >
      <icon icon="view-grid-symbolic" />
    </button>
  );
}
