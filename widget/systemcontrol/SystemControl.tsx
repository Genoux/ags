import { Gtk } from "astal/gtk3"
import { GLib } from "astal"
import { bind } from "astal"
import { showConfirmation, ConfirmationOverlay, confirmationVisible } from "./ConfirmationOverlay"

// =============================================================================
// System Control Widget
// =============================================================================

interface SystemControlButtonProps {
    icon: string
    tooltip: string
    action: () => void
    className?: string
}

function SystemControlButton({ icon, tooltip, action, className = "" }: SystemControlButtonProps) {
    return (
        <button
            className={`system-control-btn ${className}`}
            tooltip_text={tooltip}
            onClicked={action}
            hexpand>
            <icon icon={icon} />
        </button>
    )
}

function executeSystemCommand(command: string, description: string) {
    try {
        console.log(`Executing ${description}...`)
        GLib.spawn_command_line_async(command)
    } catch (error) {
        console.error(`Failed to execute ${description}:`, error)
    }
}

function handleShutdown() {
    showConfirmation({
        title: "Shutdown System",
        message: "Are you sure you want to shutdown?",
        onConfirm: () => executeSystemCommand("systemctl poweroff", "shutdown system"),
        onCancel: () => console.log("Shutdown cancelled")
    })
}

function handleSleep() {
    showConfirmation({
        title: "Suspend System", 
        message: "Put the system to sleep?",
        onConfirm: () => executeSystemCommand("systemctl suspend", "suspend system"),
        onCancel: () => console.log("Sleep cancelled")
    })
}

export default function SystemControl() {
    const systemActions = [
        {
            icon: "system-lock-screen-symbolic",
            tooltip: "Lock Screen", 
            action: () => executeSystemCommand("hyprlock", "lock screen"),
            className: "lock-btn"
        },
        {
            icon: "system-suspend-symbolic",
            tooltip: "Sleep",
            action: () => handleSleep(),
            className: "sleep-btn"
        },
        {
            icon: "system-shutdown-symbolic",
            tooltip: "Shutdown",
            action: () => handleShutdown(),
            className: "shutdown-btn"
        }
    ]

    return (
        <box className="system-control-container" vertical spacing={8}>
            {/* Main system control buttons or confirmation overlay */}
            <stack
                shown={bind(confirmationVisible).as(show => show ? "confirmation" : "controls")}
                transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN}
                transitionDuration={200}
            >
                <box name="controls" className="system-controls" spacing={8} hexpand>
                    {systemActions.map((action, index) => (
                        <SystemControlButton
                            icon={action.icon}
                            tooltip={action.tooltip}
                            action={action.action}
                            className={action.className}
                        />
                    ))}
                </box>
                
                <box name="confirmation" className="confirmation-container">
                    <ConfirmationOverlay />
                </box>
            </stack>
        </box>
    )
}