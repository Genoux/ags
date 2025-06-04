import { Gtk, Astal } from "astal/gtk3"
import { GLib } from "astal"
import { Variable } from "astal"
import { createWindowManager } from "../WindowHelper"

// TODO: MAKE THE CONFIRMATION DIALOG OVERLAY THE PANEL WITH A YES OR NO
// =============================================================================
// Confirmation Overlay
// =============================================================================

interface ConfirmationData {
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
}

const confirmationVisible = Variable(false)
const confirmationData = Variable<ConfirmationData | null>(null)

function ConfirmationDialog() {
    const data = confirmationData.get()
    if (!data) return <box />

    return (
        <eventbox 
            className="confirmation-overlay"
            onButtonPressEvent={() => {
                // Click outside to cancel
                hideConfirmation()
                if (data.onCancel) data.onCancel()
                return true
            }}>
            <box className="confirmation-container" valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER}>
                <eventbox 
                    onButtonPressEvent={() => {
                        // Prevent clicks inside dialog from closing it
                        return true
                    }}>
                    <box className="confirmation-dialog" vertical spacing={24}>
                        <box className="dialog-header" vertical spacing={8}>
                            <label className="dialog-title" label={data.title} />
                            <label className="dialog-message" label={data.message} />
                        </box>
                        
                        <box className="dialog-buttons" spacing={12} halign={Gtk.Align.CENTER}>
                            <button 
                                className="dialog-btn cancel-btn"
                                onClicked={() => {
                                    hideConfirmation()
                                    if (data.onCancel) data.onCancel()
                                }}>
                                <label label="No" />
                            </button>
                            
                            <button 
                                className="dialog-btn confirm-btn"
                                onClicked={() => {
                                    hideConfirmation()
                                    data.onConfirm()
                                }}>
                                <label label="Yes" />
                            </button>
                        </box>
                    </box>
                </eventbox>
            </box>
        </eventbox>
    )
}

// Create overlay window manager
const confirmationOverlay = createWindowManager({
    name: "confirmation-overlay",
    className: "confirmation-overlay-window",
    content: <ConfirmationDialog />,
    anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | 
            Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT,
    globalToggleName: "toggleConfirmationOverlay"
})

// Public functions
export function showConfirmation(data: ConfirmationData) {
    confirmationData.set(data)
    confirmationVisible.set(true)
    confirmationOverlay.show()
}

export function hideConfirmation() {
    confirmationVisible.set(false)
    confirmationOverlay.hide()
    confirmationData.set(null)
}

export default function ConfirmationOverlay() {
    return confirmationOverlay.createWindow()
} 