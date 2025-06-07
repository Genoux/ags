import { App } from "astal/gtk3"
import style from "./styles/main.scss"
import Bar from "./widget/Bar"
import NotificationPopup from "./widget/notifications/NotificationPopup"

App.start({
    css: style,
    main() {
        App.get_monitors().map(monitor => {
            Bar(monitor)
            NotificationPopup(monitor)
        })
    },
})
