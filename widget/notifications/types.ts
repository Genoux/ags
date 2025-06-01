import Notifd from "gi://AstalNotifd"

// =============================================================================
// Component Props Interfaces
// =============================================================================

export interface NotificationProps {
    notification: Notifd.Notification
    timestamp: number
    isRead?: boolean
    onDismiss?: () => void
    onMarkRead?: () => void
    onActionClick?: () => void
    // Optional display overrides for grouping
    displaySummary?: string
    displayBody?: string
    showActions?: boolean
}

export interface NotificationButtonProps {
    className?: string
    showCount?: boolean
    showCriticalIndicator?: boolean
}

export interface NotificationCenterProps {
    maxHeight?: number
    showFilters?: boolean
    showStats?: boolean
}

// =============================================================================
// Action Interface
// =============================================================================

export interface NotificationAction {
    id: string
    label: string
    callback: () => void
} 