import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable } from "astal"
import Hyprland from "gi://AstalHyprland"

export default function WindowTitle() {
    const hypr = Hyprland.get_default()
    
    // Create a trigger variable to force updates when the active window changes
    const updateTrigger = Variable(0)
    let titleSignalId: number | null = null
    
    function triggerUpdate() {
        updateTrigger.set(updateTrigger.get() + 1)
    }
    
    // Listen to window focus events to trigger updates
    hypr.connect("notify::focused-client", () => {
        // Remove listener from previous client if any
        if (titleSignalId !== null && hypr.focusedClient) {
            hypr.focusedClient.disconnect(titleSignalId)
            titleSignalId = null
        }
        
        const currentClient = hypr.focusedClient
        
        // Listen to title changes on the focused client
        if (currentClient) {
            titleSignalId = currentClient.connect("notify::title", triggerUpdate)
        }
        
        triggerUpdate()
    })
    
    // Also listen to client events in case window titles change
    hypr.connect("client-added", triggerUpdate)
    hypr.connect("client-removed", triggerUpdate)

    return <box className="window-title">
        {bind(updateTrigger).as(() => {
            const focusedClient = hypr.focusedClient
            
            if (!focusedClient) {
                return <box spacing={8}>
                    <icon icon="desktop-symbolic" />
                    <label label="Desktop" />
                </box>
            }
            
            // Get the window title and class for display
            const title = focusedClient.title || "Unknown"
            const appClass = focusedClient.class || "unknown"
            const displayText = title.length > 50 ? title.substring(0, 47) + "..." : title
            
            return <box spacing={4}>
                {appClass.toLowerCase() !== "kitty" && (
                    <icon 
                        icon={(() => {
                            // Try different variants of the app's actual icon
                            const possibleIcons = [
                                appClass.toLowerCase(),
                                `${appClass.toLowerCase()}-symbolic`,
                                appClass,
                                `${appClass}-symbolic`,
                                "application-x-executable-symbolic"
                            ]
                            
                            for (const iconName of possibleIcons) {
                                if (Astal.Icon.lookup_icon(iconName)) {
                                    return iconName
                                }
                            }
                            
                            return "application-x-executable-symbolic"
                        })()} 
                    />
                )}
                <label 
                    label={displayText}
                    tooltip_text={`${focusedClient.class}: ${title}`}
                    ellipsize={3} // PANGO_ELLIPSIZE_END
                />
            </box>
        })}
    </box>
} 