import { bind } from "astal"
import { keyboardLang, switchKeyboardLayout } from "../Widget"

// UI Component - 100% Pure UI
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