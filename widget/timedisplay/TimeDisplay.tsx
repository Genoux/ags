import { Variable } from "astal"
import { Gtk } from "astal/gtk3"

const time = Variable("").poll(1000, () => {
    const now = new Date()
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/Montreal' }))
        .toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Montreal'
        })
})

export default function TimeDisplay() {
    return (
        <button
            className="time-display"
            halign={Gtk.Align.CENTER}
        >
            <label label={time()} />
        </button>
    )
} 