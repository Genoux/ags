import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable } from "astal"
import Hyprland from "gi://AstalHyprland"

export default function Workspaces() {
    const hypr = Hyprland.get_default()
    
    // Create a trigger variable to force updates when clients change
    const updateTrigger = Variable(0)
    
    // Listen to client events to trigger updates
    hypr.connect("client-added", () => {
        updateTrigger.set(updateTrigger.get() + 1)
    })
    
    hypr.connect("client-removed", () => {
        updateTrigger.set(updateTrigger.get() + 1)
    })
    
    // Also listen to workspace events
    hypr.connect("workspace-added", () => {
        updateTrigger.set(updateTrigger.get() + 1)
    })
    
    hypr.connect("workspace-removed", () => {
        updateTrigger.set(updateTrigger.get() + 1)
    })

    return <box className="workspaces">
        {bind(updateTrigger).as(() => {
            const workspaces = hypr.get_workspaces()
            
            // Only show normal workspaces
            const normalWorkspaces = workspaces
                .filter(ws => ws.id > 0)
                .sort((a, b) => a.id - b.id)
            
            return normalWorkspaces.map(ws => {
                const clients = ws.get_clients()
                const isOccupied = clients.length > 0
                
                return (
                    <button
                        className={bind(hypr, "focusedWorkspace").as(focused => {
                            const isFocused = focused?.id === ws.id
                            // For now, consider a workspace "active" if it has windows but isn't focused
                            // You can extend this logic based on your needs
                            const isActive = isOccupied && !isFocused
                            return `workspace ${isFocused ? "focused" : ""} ${isOccupied ? "occupied" : ""} ${isActive ? "active" : ""}`
                        })}
                        onClicked={() => {
                            ws.focus()
                        }}
                        tooltip_text={`Workspace ${ws.id}`}
                    >
                        {bind(hypr, "focusedWorkspace").as(focused => {
                            const isFocused = focused?.id === ws.id
                            const isActive = isOccupied && !isFocused
                            
                            const dotClass = isFocused ? 'focused-dot' : 
                                           isActive ? 'active-dot' : 
                                           isOccupied ? 'occupied-dot' : 'empty-dot'
                            
                            if (!isOccupied) {
                                // Empty workspace - show number
                                return <box className="workspace-number" heightRequest={1} widthRequest={1} >
                                    {ws.id.toString()}
                                </box>
                            } else {
                                // Occupied workspace - show dot
                                return <box className={`workspace-dot ${dotClass}`} widthRequest={9} heightRequest={1}></box>
                            }
                        })}
                    </button>
                )
            })
        })}
    </box>
} 