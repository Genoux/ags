import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable } from "astal"
import Hyprland from "gi://AstalHyprland"

export default function Workspaces() {
    const hypr = Hyprland.get_default()
    
    // Create a map to track client count per workspace
    const workspaceClients = Variable(new Map())
    
    // Function to update workspace client counts
    const updateWorkspaceClients = () => {
        const clientMap = new Map()
        const workspaces = hypr.get_workspaces()
        
        workspaces.forEach(ws => {
            if (ws.id > 0) { // Only normal workspaces
                const clients = ws.get_clients()
                clientMap.set(ws.id, clients.length)
            }
        })
        
        workspaceClients.set(clientMap)
    }
    
    // Initial update
    updateWorkspaceClients()
    
    // Listen to all relevant events
    const events = [
        "client-added",
        "client-removed", 
        "workspace-added",
        "workspace-removed"
    ]
    
    events.forEach(event => {
        hypr.connect(event, updateWorkspaceClients)
    })
    
    return (
        <box className="workspaces">
            {bind(workspaceClients).as(clientMap => {
                const workspaces = hypr.get_workspaces()
                    .filter(ws => ws.id > 0)
                    .sort((a, b) => a.id - b.id)
                
                return workspaces.map(ws => {
                    const clientCount = clientMap.get(ws.id) || 0
                    const isOccupied = clientCount > 0
                    
                    return (
                        <button
                            className={bind(hypr, "focusedWorkspace").as(focused => {
                                const isFocused = focused?.id === ws.id
                                const isActive = isOccupied && !isFocused
                                
                                return [
                                    "workspace",
                                    isFocused && "focused",
                                    isOccupied && "occupied", 
                                    isActive && "active"
                                ].filter(Boolean).join(" ")
                            })}
                            onClicked={() => ws.focus()}
                            tooltip_text={`Workspace ${ws.id}${isOccupied ? ` (${clientCount} windows)` : ""}`}
                        >
                            {bind(hypr, "focusedWorkspace").as(focused => {
                                const isFocused = focused?.id === ws.id
                                
                                if (!isOccupied) {
                                    // Empty workspace - show number
                                    return (
                                        <box 
                                            className="workspace-number" 
                                            heightRequest={12} 
                                            widthRequest={12}
                                        >
                                            {ws.id.toString()}
                                        </box>
                                    )
                                } else {
                                    // Occupied workspace - show dot
                                    const dotClass = isFocused ? "focused-dot" : "occupied-dot"
                                    return (
                                        <box 
                                            className={`workspace-dot ${dotClass}`} 
                                            widthRequest={9} 
                                            heightRequest={9}
                                        />
                                    )
                                }
                            })}
                        </button>
                    )
                })
            })}
        </box>
    )
}