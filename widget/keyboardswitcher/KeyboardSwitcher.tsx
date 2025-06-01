import { Variable, bind, exec, subprocess } from "astal"
import GLib from "gi://GLib"

// Variable to store the current keyboard language
const keyboardLang = Variable("EN")

// Function to map layout names to display format
function mapLayoutName(layout: string): string {
    const layoutMap: { [key: string]: string } = {
        'us': 'En',
        'english': 'En',
        'american': 'En',
        'fr': 'Fr',
        'french': 'Fr',
    }
    
    const normalizedLayout = layout.toLowerCase()
    if (layoutMap[normalizedLayout]) {
        return layoutMap[normalizedLayout]
    }
    
    // Fallback: First letter uppercase, second letter lowercase
    const layoutCode = layout.slice(0, 2).toLowerCase()
    return layoutCode.charAt(0).toUpperCase() + layoutCode.slice(1)
}

// Function to get current keyboard layout (one-time)
function getCurrentLayout(): string {
    try {
        const devicesOutput = exec("hyprctl devices -j")
        const devices = JSON.parse(devicesOutput)
        
        if (devices.keyboards && Array.isArray(devices.keyboards)) {
            const mainKeyboard = devices.keyboards.find((kb: any) => kb.main === true)
            if (mainKeyboard && mainKeyboard.active_keymap) {
                return mapLayoutName(mainKeyboard.active_keymap)
            }
        }
    } catch (error) {
        // Silent fallback
    }
    
    return "En"
}

// Function to switch keyboard layout
function switchKeyboardLayout() {
    try {
        // Get all keyboards and switch them
        const devicesOutput = exec("hyprctl devices -j")
        const devices = JSON.parse(devicesOutput)
        
        if (devices.keyboards && Array.isArray(devices.keyboards)) {
            const mainKeyboard = devices.keyboards.find((kb: any) => kb.main === true)
            if (mainKeyboard) {
                exec(`hyprctl switchxkblayout ${mainKeyboard.name} next`)
            }
        }
    } catch (error) {
        console.log("Failed to switch keyboard layout:", error)
    }
}

// Initialize with current layout
keyboardLang.set(getCurrentLayout())

// Listen to Hyprland socket events for instant updates
try {
    const hyprlandInstance = GLib.getenv("HYPRLAND_INSTANCE_SIGNATURE")
    const xdgRuntimeDir = GLib.getenv("XDG_RUNTIME_DIR") || "/run/user/1000"
    
    if (hyprlandInstance) {
        const socketPath = `${xdgRuntimeDir}/hypr/${hyprlandInstance}/.socket2.sock`
        subprocess(
            ["socat", "-u", `UNIX-CONNECT:${socketPath}`, "-"],
            (output) => {
                const lines = output.trim().split('\n')
                for (const line of lines) {
                    if (line.startsWith('activelayout>>')) {
                        // Parse: activelayout>>keyboard_name,layout_name
                        const parts = line.split(',')
                        if (parts.length >= 2) {
                            const layout = mapLayoutName(parts[1])
                            keyboardLang.set(layout)
                        }
                    }
                }
            }
        )
    } else {
        throw new Error("HYPRLAND_INSTANCE_SIGNATURE not found")
    }
} catch (error) {
    console.log("Failed to connect to Hyprland socket, using fallback")
    // Fallback to minimal polling (only if socket fails)
    keyboardLang.poll(2000, getCurrentLayout)
}

export default function KeyboardSwitcher() {
    return (
        <button 
            className="keyboard-lang-widget"
            onClicked={switchKeyboardLayout}
        >
            <label label={bind(keyboardLang)} />
        </button>
    )
}

// Export the keyboard language variable for other components to use
export { keyboardLang } 