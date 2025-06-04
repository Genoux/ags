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

    function show() {
        const win = createWindow()
        win.visible = true
        win.present()
        isVisible.set(true)
    }

    function hide() {
        const win = createWindow()
        win.visible = false
        isVisible.set(false)
    }

    // Enhanced functions for click-outside functionality
    let enhancedShow = show
    let enhancedHide = hide
    let overlay: Widget.Window | null = null

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
            window.connect("button-press-event", () => {
                config.onWindowClick!()
                return true
            })
        }

        // Always enable click-outside-to-close behavior
        console.log("Setting up click-outside-to-close for", config.name)
        
        // Use a transparent overlay window to catch outside clicks
        overlay = new Widget.Window({
            name: `${config.name}-click-overlay`,
            layer: Astal.Layer.OVERLAY,
            exclusivity: Astal.Exclusivity.IGNORE,
            anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | 
                    Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT,
            visible: false,
            child: new Widget.EventBox({
                onButtonPressEvent: () => {
                    console.log("Click outside detected via overlay, closing", config.name)
                    enhancedHide()
                    overlay!.visible = false
                    return true
                }
            })
        })

        // Show/hide overlay with main window
        enhancedShow = () => {
            show()
            overlay!.visible = true
        }
        
        enhancedHide = () => {
            hide()
            overlay!.visible = false
        }

        return window
    }

    const manager = {
        toggle: () => {
            if (isVisible.get()) {
                enhancedHide()
            } else {
                enhancedShow()
            }
        },
        show: enhancedShow,
        hide: enhancedHide,
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