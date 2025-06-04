import { Gtk } from "astal/gtk3"
import { GLib } from "astal"
import { Variable, bind } from "astal"

// =============================================================================
// System Control Widget
// =============================================================================

interface SystemControlButtonProps {
    icon: string
    tooltip: string
    action: () => void
    className?: string
}

interface ConfirmationData {
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
}

// State for inline confirmation
const showInlineConfirmation = Variable(false)
const confirmationData = Variable<ConfirmationData | null>(null)

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

function InlineConfirmationOverlay() {
    const data = confirmationData.get()
    if (!data) return <box />

    return (
        <box className="inline-confirmation-overlay" vertical spacing={8}>
            <box className="confirmation-header" vertical spacing={4}>
                <label 
                    className="confirmation-title" 
                    label={data.title}
                    halign={Gtk.Align.CENTER}
                />
                <label 
                    className="confirmation-message" 
                    label={data.message}
                    halign={Gtk.Align.CENTER}
                />
            </box>
            
            <box className="confirmation-buttons" spacing={8} halign={Gtk.Align.CENTER}>
                <button 
                    className="confirmation-btn cancel-btn"
                    onClicked={() => {
                        showInlineConfirmation.set(false)
                        if (data.onCancel) data.onCancel()
                        confirmationData.set(null)
                    }}>
                    <label label="No" />
                </button>
                
                <button 
                    className="confirmation-btn confirm-btn" 
                    onClicked={() => {
                        showInlineConfirmation.set(false)
                        data.onConfirm()
                        confirmationData.set(null)
                    }}>
                    <label label="Yes" />
                </button>
            </box>
        </box>
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

function showInlineConfirmationDialog(data: ConfirmationData) {
    confirmationData.set(data)
    showInlineConfirmation.set(true)
}

function handleShutdown() {
    showInlineConfirmationDialog({
        title: "Shutdown",
        message: "Are you sure?",
        onConfirm: () => executeSystemCommand("systemctl poweroff", "shutdown system"),
        onCancel: () => console.log("Shutdown cancelled")
    })
}

function handleSleep() {
    showInlineConfirmationDialog({
        title: "Sleep",
        message: "Suspend system?",
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
                shown={bind(showInlineConfirmation).as(show => show ? "confirmation" : "controls")}
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
                    <InlineConfirmationOverlay />
                </box>
            </stack>
        </box>
    )
}