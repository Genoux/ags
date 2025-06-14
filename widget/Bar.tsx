import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import { bind } from "astal";
import Workspaces from "./workspaces";
import WindowTitle from "./windowtitle";
import KeyboardSwitcher from "./keyboardswitcher";
import { AudioButton } from "./audiocontrols";
import TimeDisplay from "./timedisplay";
import ControlPanelButton from "./controlpanel";
import { NotificationButton } from "./notifications";
import SystemTray, { TrayService } from "./systemtray";

function LeftSection() {
  return (
    <box className="bar-section bar-left" halign={Gtk.Align.START} spacing={4}>
      <box className="bar-item control-panel">
        <ControlPanelButton />
      </box>
      <box className="bar-item workspaces">
        <Workspaces />
      </box>
      <box className="bar-item system-tray" visible={bind(TrayService, "items").as(items => items.length > 0)}>
        <SystemTray />
      </box>
    </box>
  );
}

function CenterSection() {
  return (
    <box className="bar-section bar-center bar-item" halign={Gtk.Align.CENTER}>
      <WindowTitle />
    </box>
  );
}

function RightSection() {
  return (
    <box className="bar-section bar-right bar-item" halign={Gtk.Align.END}>
      <NotificationButton />
      <KeyboardSwitcher />
      <AudioButton />
      <TimeDisplay className="time-display" />
    </box>
  );
}

interface BarProps {
  gdkmonitor: Gdk.Monitor;
}

export default function Bar({ gdkmonitor }: BarProps) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;

  return (
    <window
      name="Bar"
      className="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={BOTTOM | LEFT | RIGHT}
      heightRequest={24}
      application={App}
    >
      <centerbox className="bar-container">
        <LeftSection />
        <CenterSection />
        <RightSection />
      </centerbox>
    </window>
  );
}
