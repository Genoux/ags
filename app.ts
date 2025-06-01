import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/Bar"
import NotificationCenter from "./widget/notifications/NotificationCenter"
import NotificationPopups from "./widget/notifications/components/NotificationPopup"

App.start({
    css: style,
    main() {
        App.get_monitors().map(monitor => {
            Bar(monitor)
            NotificationCenter(monitor)
        })
        
        // Notification popups (only need one instance)
        NotificationPopups()
    },
})
