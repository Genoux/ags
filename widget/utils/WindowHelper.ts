import { Widget, Astal } from "astal/gtk3"
import { Variable } from "astal"

interface SimpleWindowConfig {
    name: string
    className: string
    content: any
    anchor?: Astal.WindowAnchor
}

export function createSimpleWindow(config: SimpleWindowConfig) {
    const isVisible = Variable(false)
    
    const window = new Widget.Window({
        name: config.name,
        className: config.className,
        anchor: config.anchor || (Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT),
        visible: false,
        keymode: Astal.Keymode.ON_DEMAND,
    }, config.content)

    return {
        window,
        isVisible,
        toggle: () => {
            const visible = !isVisible.get()
            isVisible.set(visible)
            window.visible = visible
            if (visible) {
                window.present()
            }
        },
        show: () => {
            isVisible.set(true)
            window.visible = true
            window.present()
        },
        hide: () => {
            isVisible.set(false)
            window.visible = false
        }
    }
} 