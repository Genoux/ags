import { Gtk } from "astal/gtk3"
import { bind } from "astal"
import { workspaceClients, hypr } from "../Widget"

// UI Component - 100% Pure UI
export default function Workspaces() {
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
                                        <label
                                        className="workspace-number"
                                        label={ws.id.toString()}
                                        halign={Gtk.Align.CENTER}
                                        valign={Gtk.Align.CENTER}
                                        heightRequest={12}
                                        widthRequest={12}
                                    />
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