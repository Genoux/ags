import { Widget, Astal } from "astal/gtk3"
import { Variable } from "astal"

interface WindowConfig {
    name: string
    className: string
    content: any
    anchor?: Astal.WindowAnchor
}

export function createWindow(config: WindowConfig) {
    const isVisible = Variable(false)
    
    const window = new Widget.Window({
        name: config.name,
        className: config.className,
        anchor: config.anchor || (Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT),
        visible: false,
    })
    
    window.child = config.content
    
    return {
        window,
        isVisible,
        toggle: () => {
            const visible = !isVisible.get()
            isVisible.set(visible)
            window.visible = visible
            if (visible) window.present()
        }
    }
}

export const createSimpleWindow = createWindow 