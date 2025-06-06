import { Widget, Astal, Gtk } from "astal/gtk3"
import { Variable } from "astal"

interface WindowConfig {
    name: string
    className: string
    content: Gtk.Widget // Widget content
    anchor?: Astal.WindowAnchor
    globalToggleName?: string // Optional: register toggle function globally
    onWindowClick?: () => void // Optional: custom click handler
    referenceWidget?: Gtk.Widget // Widget to position relative to
    margin?: { top?: number, bottom?: number, left?: number, right?: number }
}

export function createWindowManager(config: WindowConfig) {
    const isVisible = Variable(false)
    let window: Widget.Window | null = null
    let signalHandlers: { widget: any, id: number }[] = []

    function show() {
        const win = createWindow()
        win.visible = true
        win.present()
        isVisible.set(true)
    }

    function hide() {
        if (window) {
            window.visible = false
        }
        isVisible.set(false)
    }

    function cleanup() {
        // Disconnect all signal handlers with proper error handling
        signalHandlers.forEach(({ widget, id }) => {
            try {
                if (widget && typeof widget.disconnect === 'function') {
                    widget.disconnect(id)
                }
            } catch (error) {
                // Handler might already be disconnected or widget destroyed
                console.warn(`Failed to disconnect signal handler ${id}:`, error)
            }
        })
        signalHandlers = []
        
        // Cleanup main window
        if (window) {
            try {
                window.destroy()
            } catch (error) {
                // Window might already be destroyed
                console.warn("Failed to destroy window:", error)
            }
            window = null
        }
    }

    function createWindow() {
        if (window) {
            return window
        }

        // Calculate position if reference widget is provided
        let windowProps: any = {
            name: config.name,
            className: config.className,
            anchor: config.anchor || (Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT),
            visible: false,
            keymode: Astal.Keymode.ON_DEMAND,
        }

        // Add margins if provided
        if (config.margin) {
            if (config.margin.top !== undefined) windowProps.margin_top = config.margin.top
            if (config.margin.bottom !== undefined) windowProps.margin_bottom = config.margin.bottom
            if (config.margin.left !== undefined) windowProps.margin_left = config.margin.left
            if (config.margin.right !== undefined) windowProps.margin_right = config.margin.right
        }
        
        window = new Widget.Window(windowProps, config.content)
        
        // Add custom click handler if provided
        if (config.onWindowClick) {
            const handlerId = window.connect("button-press-event", () => {
                config.onWindowClick!()
                return true
            })
            signalHandlers.push({ widget: window, id: handlerId })
        }

        // Implement proper click-outside-to-close behavior
            console.log("Setting up click-outside-to-close for", config.name)
            
        // Connect to root window to detect clicks outside
        try {
            const screen = window.get_screen()
            const rootWindow = screen?.get_root_window()
            
            if (rootWindow) {
                const rootClickHandlerId = rootWindow.connect("button-press-event", (widget: any, event: any) => {
                    if (!isVisible.get() || !window) {
                        return false
                    }

                    try {
                        // Get window allocation - add null check for TypeScript
                        if (!window) return false
                        const currentWindow = window // Store reference after null check
                        const allocation = currentWindow.get_allocation()
                        const [winX, winY] = currentWindow.get_position()
                        
                        // Get event coordinates
                        const [eventX, eventY] = event.get_root_coords()
                        
                        // Check if click is outside window bounds
                        const isOutside = (
                            eventX < winX || 
                            eventX > winX + allocation.width ||
                            eventY < winY || 
                            eventY > winY + allocation.height
                        )
                        
                        if (isOutside) {
                            console.log("Click outside detected for", config.name, "- closing window")
                            hide()
                        }
                    } catch (error) {
                        console.warn("Error in click-outside detection:", error)
                    }
                    
                    return false
                })
                signalHandlers.push({ widget: rootWindow, id: rootClickHandlerId })
            } else {
                console.warn("Could not get root window for click-outside detection")
            }
        } catch (error) {
            console.warn("Failed to setup click-outside detection:", error)
        }

        // Cleanup when main window is destroyed
        const destroyHandlerId = window.connect("destroy", () => {
            cleanup()
        })
        signalHandlers.push({ widget: window, id: destroyHandlerId })

        return window
    }

    const manager = {
        toggle: () => {
            if (isVisible.get()) {
                hide()
            } else {
                show()
            }
        },
        show,
        hide,
        cleanup,
        isVisible,
        content: config.content,
        createWindow
    }

    // Optional: Register toggle function globally
    if (config.globalToggleName) {
        ;(globalThis as any)[config.globalToggleName] = manager.toggle
    }

    return manager
} 