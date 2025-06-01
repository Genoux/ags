import { Gtk } from "astal/gtk3"
import { NotificationProps } from "../types"
import { getValidIcon, formatRelativeTime } from "../utils"

// =============================================================================
// Sub-components
// =============================================================================

function NotificationHeader({ notification, timestamp, onDismiss, onMarkRead }: NotificationProps) {
    const appIcon = getValidIcon(
        notification.appIcon, 
        notification.desktopEntry, 
        notification.appName
    )

    return (
        <box className="notification-header" spacing={4}>
            <icon className="app-icon" icon={appIcon} />
            
            <label 
                className="app-name"
                label={notification.appName || "Unknown App"}
                hexpand
                halign={Gtk.Align.START}
            />
            
            <label 
                className="timestamp"
                label={formatRelativeTime(timestamp)}
            />
            
            <box className="action-buttons">
                {onDismiss && (
                    <button 
                        className="dismiss-btn"
                        tooltip_text="Dismiss"
                        onClicked={onDismiss}>
                        <icon icon="window-close-symbolic" />
                    </button>
                )}
            </box>
        </box>
    )
}

function NotificationContent({ 
    notification, 
    displaySummary, 
    displayBody 
}: Pick<NotificationProps, 'notification' | 'displaySummary' | 'displayBody'>) {
    const summary = displaySummary || notification.summary || ""
    const body = displayBody || notification.body || ""
    const hasImage = notification.image && notification.image.trim() !== ""

    return (
        <box className="notification-content">
            {hasImage && (
                <box 
                    className="notification-image"
                    css={`background-image: url('${notification.image}');`}
                />
            )}
            
            <box className="text-content" vertical>
                {summary && (
                    <label 
                        className="summary"
                        label={summary}
                        halign={Gtk.Align.START}
                        wrap
                        ellipsize={3} // PANGO_ELLIPSIZE_END
                    />
                )}
                
                {body && (
                    <label 
                        className="body"
                        label={body}
                        halign={Gtk.Align.START}
                        wrap
                        ellipsize={3}
                    />
                )}
            </box>
        </box>
    )
}

function NotificationActions({ 
    notification, 
    showActions = true,
    onActionClick 
}: Pick<NotificationProps, 'notification' | 'showActions' | 'onActionClick'>) {
    if (!showActions || !notification.actions || notification.actions.length === 0) {
        return null
    }

    return (
        <box className="notification-actions">
            {notification.actions.map((action, index) => (
                <button 
                    className="action-button"
                    onClicked={() => {
                        try {
                            notification.invoke(action.id)
                            // Call the callback after invoking the action
                            if (onActionClick) {
                                onActionClick()
                            }
                        } catch (error) {
                            console.error("Failed to invoke notification action:", error)
                        }
                    }}>
                    <label label={action.label} />
                </button>
            ))}
        </box>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export default function NotificationItem({
    notification,
    timestamp,
    isRead = false,
    onDismiss,
    onMarkRead,
    onActionClick,
    displaySummary,
    displayBody,
    showActions = true
}: NotificationProps) {
    const readClass = isRead ? "read" : "unread"

    return (
        <eventbox 
            className={`notification ${readClass}`}>
            <box className="notification-container" vertical>
                <NotificationHeader 
                    notification={notification}
                    timestamp={timestamp}
                    onDismiss={onDismiss}
                    onMarkRead={onMarkRead}
                />
                
                <box className="separator" />
                
                <NotificationContent 
                    notification={notification}
                    displaySummary={displaySummary}
                    displayBody={displayBody}
                />
                
                <NotificationActions 
                    notification={notification}
                    showActions={showActions}
                    onActionClick={onActionClick}
                />
            </box>
        </eventbox>
    )
} 