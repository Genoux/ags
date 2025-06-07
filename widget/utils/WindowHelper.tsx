import { Widget, Astal, Gtk } from "astal/gtk3"
import { Variable } from "astal"

interface WindowConfig {
    name: string
    className: string
    content: Gtk.Widget
    anchor?: Astal.WindowAnchor
    margin?: { top?: number, bottom?: number, left?: number, right?: number }
    onWindowClick?: () => void
    globalToggleName?: string
    autoHide?: boolean // Default: true
}

export function createWindowManager(config: WindowConfig) {
    const isVisible = Variable(false)
    const autoHide = config.autoHide !== false // Default to true
    let window: Widget.Window | null = null
    let cleanupFunctions: (() => void)[] = []

    function addCleanup(fn: () => void) {
        cleanupFunctions.push(fn)
    }

    function show() {
        if (!window) {
            createWindow()
        }
        if (window) {
            window.visible = true
            window.present()
            isVisible.set(true)
        }
    }

    function hide() {
        if (window) {
            window.visible = false
            isVisible.set(false)
        }
    }

    function cleanup() {
        cleanupFunctions.forEach(fn => {
            try {
                fn()
            } catch (error) {
                console.warn("Cleanup function failed:", error)
            }
        })
        cleanupFunctions = []
        
        if (window) {
            try {
                window.destroy()
            } catch (error) {
                console.warn("Failed to destroy window:", error)
            }
            window = null
        }
    }

    function createWindow() {
        if (window) return window

        const windowProps: any = {
            name: config.name,
            className: config.className,
            anchor: config.anchor || (Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT),
            visible: false,
            keymode: Astal.Keymode.ON_DEMAND,
        }

        // Add margins
        if (config.margin) {
            if (config.margin.top !== undefined) windowProps.margin_top = config.margin.top
            if (config.margin.bottom !== undefined) windowProps.margin_bottom = config.margin.bottom
            if (config.margin.left !== undefined) windowProps.margin_left = config.margin.left
            if (config.margin.right !== undefined) windowProps.margin_right = config.margin.right
        }
        
        window = new Widget.Window(windowProps, config.content)
        
        // Auto-hide on focus loss
        if (autoHide) {
            const focusOutId = window.connect("focus-out-event", () => {
                // Small delay to prevent immediate hiding when clicking within window
                setTimeout(() => {
                    if (isVisible.get()) {
                        hide()
                    }
                }, 100)
                return false
            })
            addCleanup(() => window?.disconnect(focusOutId))
        }

        // Custom window click handler
        if (config.onWindowClick) {
            const clickId = window.connect("button-press-event", (_, event: any) => {
                if (event.button === 1) { // Left click
                    config.onWindowClick!()
                }
                return false
            })
            addCleanup(() => window?.disconnect(clickId))
        }

        // Cleanup on destroy
        const destroyId = window.connect("destroy", cleanup)
        addCleanup(() => window?.disconnect(destroyId))

        // ESC key to close
        if (autoHide) {
            const keyPressId = window.connect("key-press-event", (_, event: any) => {
                if (event.keyval === 65307) { // ESC key
                    hide()
                    return true
                }
                return false
            })
            addCleanup(() => window?.disconnect(keyPressId))
        }

        return window
    }

    const manager = {
        toggle: () => isVisible.get() ? hide() : show(),
        show,
        hide,
        cleanup,
        isVisible: isVisible.get,
        get window() { return window }
    }

    // Register global toggle
    if (config.globalToggleName) {
        ;(globalThis as any)[config.globalToggleName] = manager.toggle
    }

    return manager
}