# Notifications Module

A well-organized notification system with proper separation of concerns.

## 📁 File Structure

```
notifications/
├── components/
│   └── NotificationItem.tsx       # Individual notification component
├── store/
│   ├── index.ts                   # Store exports
│   ├── NotificationStore.ts       # Main store class
│   ├── config.ts                  # Configuration & defaults
│   ├── types.ts                   # Store-specific types
│   ├── filters.ts                 # Filtering logic
│   └── grouping.ts                # Notification grouping
├── utils/
│   ├── index.ts                   # Utils exports
│   ├── time.ts                    # Time formatting
│   ├── icons.ts                   # Icon resolution
│   └── formatting.ts              # Priority/urgency formatting
├── styles/
│   ├── index.scss                 # Main styles import
│   ├── notification-center.scss   # Center component styles
│   ├── notification-item.scss     # Item component styles
│   └── notification-button.scss   # Button component styles
├── NotificationButton.tsx         # Main button component
├── NotificationCenter.tsx         # Center panel component
├── types.ts                       # General types & enums
└── index.ts                       # Main module exports
```

## 🎯 Key Improvements

### 1. **Modular Store Architecture**
- **Before**: 318-line monolithic `store.ts`
- **After**: Separated into focused modules:
  - `NotificationStore.ts` - Core store logic
  - `config.ts` - Configuration & defaults
  - `filters.ts` - Filtering & classification
  - `grouping.ts` - Notification grouping

### 2. **Organized Utilities**
- **Before**: 176-line `utils.ts` with mixed concerns  
- **After**: Focused utility modules:
  - `time.ts` - Time formatting utilities
  - `icons.ts` - Icon resolution logic
  - `formatting.ts` - Priority/urgency helpers

### 3. **Structured Styles**
- **Before**: Scattered SCSS files with unclear naming
- **After**: Organized in `styles/` directory with:
  - Clear naming convention
  - Centralized imports via `index.scss`
  - Component-specific stylesheets

### 4. **Clean Type Organization**
- **Before**: All types mixed in one file
- **After**: Separated by domain:
  - `types.ts` - Component props & general types
  - `store/types.ts` - Store-specific interfaces

## 🚀 Usage

```typescript
// Import components
import { NotificationButton, NotificationCenter } from "@notifications"

// Import store
import { notificationStore } from "@notifications"

// Import utilities
import { formatRelativeTime, getValidIcon } from "@notifications"

// Import types
import { NotificationPriority, NotificationProps } from "@notifications"
```

## 🔧 Configuration

The store can be configured with custom settings:

```typescript
import { notificationStore } from "@notifications"

// Access configuration (read-only)
console.log(notificationStore.config)

// For custom instances:
import NotificationStore from "@notifications/store/NotificationStore"
const customStore = new NotificationStore({
    maxStoredNotifications: 200,
    ignoredApps: ["custom-app"],
    autoCleanupInterval: 600000 // 10 minutes
})
```

## 📈 Benefits

1. **Maintainability**: Smaller, focused files are easier to understand and modify
2. **Testability**: Isolated modules can be tested independently  
3. **Reusability**: Utility functions are organized and easily discoverable
4. **Scalability**: Clear structure supports future feature additions
5. **Developer Experience**: Better IDE support with organized imports 