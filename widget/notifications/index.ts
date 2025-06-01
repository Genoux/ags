// Main components
export { default as NotificationButton } from "./NotificationButton"
export { default as NotificationCenter } from "./NotificationCenter"
export { default as NotificationItem } from "./components/NotificationItem"
export { default as NotificationPopup } from "./components/NotificationPopup"

// Store (now properly organized)
export { notificationStore } from "./store"
export type { StoredNotification, GroupedNotification, NotificationFilter, NotificationStoreConfig } from "./store"

// Component types and enums
export * from "./types"

// Utilities (now properly organized)
export { 
    formatTime, 
    formatRelativeTime,
    getValidIcon,
    isIcon,
    fileExists,
} from "./utils"

// Default export for backward compatibility
export { default } from "./NotificationButton" 