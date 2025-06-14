import { App } from "astal/gtk3";
import AstalHyprland from "gi://AstalHyprland?version=0.1";

const hyprland = AstalHyprland.get_default();

export const sendBatch = (batch: string[]) => {
  const cmd = batch
    .filter((x) => !!x)
    .map((x) => `keyword ${x}`)
    .join("; ");

  console.log("Sending Hyprland batch:", cmd);
  hyprland.message(`[[BATCH]]/${cmd}`);
};

export function windowAnimation() {
  const windows = App.get_windows();
  console.log("Available AGS windows:", windows.map(w => ({ name: w.name })));
  
  // Since all AGS windows show up as gtk-layer-shell, we need to use a different approach
  // We'll set global layer rules for gtk-layer-shell and use CSS animations instead
  sendBatch([
    "layerrule animation slide, gtk-layer-shell",
    "layerrule blur, gtk-layer-shell", 
    "layerrule ignorealpha 0.3, gtk-layer-shell"
  ]);
}

function windowBlur() {
  // Apply blur to all gtk-layer-shell windows (AGS windows)
  sendBatch([
    "layerrule blur, gtk-layer-shell",
    "layerrule ignorealpha 0.3, gtk-layer-shell"
  ]);
}

export default function initHyprland() {
  console.log("Initializing Hyprland layer rules...");
  
  // Wait a bit for windows to be created
  setTimeout(() => {
    windowAnimation();
    windowBlur();
  }, 1000);

  hyprland.connect("config-reloaded", () => {
    console.log("Hyprland config reloaded, reapplying rules...");
    windowAnimation();
    windowBlur();
  });
}

// Export hyprland instance for use in other components
export { hyprland };