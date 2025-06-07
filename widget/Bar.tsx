import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import { bind } from "astal";
import { GLib } from "astal";
import Tray from "gi://AstalTray";
import Workspaces from "./workspaces";
import WindowTitle from "./windowtitle";
import KeyboardSwitcher from "./keyboardswitcher";
import AudioButton from "./audiocontrols";
import TimeDisplay from "./timedisplay";
import ControlPanelButton from "./controlpanel";
import NotificationButton from "./notifications/NotificationButton";
import SystemTray from "./systemtray";

function LeftSection() {
  return (
    <box className="bar-section bar-left" halign={Gtk.Align.START} spacing={6}>
      <box className="bar-item control-panel">
        <ControlPanelButton />
      </box>
      <box className="bar-item workspaces">
        <Workspaces />
      </box>
      <box className="bar-item system-tray">
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

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;

  return (
    <window
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
