import { GLib } from "astal"
import { Astal } from "astal/gtk3"

// =============================================================================
// File and Icon Utilities
// =============================================================================

export const isIcon = (icon: string): boolean =>
    !!Astal.Icon.lookup_icon(icon)

export const fileExists = (path: string): boolean =>
    GLib.file_test(path, GLib.FileTest.EXISTS)

// =============================================================================
// Advanced Icon Resolution
// =============================================================================

const ICON_VARIATIONS = {
    // Common app name patterns
    getNameVariations: (name: string): string[] => [
        name,
        name.replace(/\s+/g, '-'),
        name.replace(/\s+/g, '_'),
        name.replace(/\s+/g, ''),
        `${name}-symbolic`,
        `${name.replace(/\s+/g, '-')}-symbolic`,
    ],
    
    // Common prefixes for modern apps
    getPrefixVariations: (name: string): string[] => [
        `com.${name}`,
        `org.${name}`,
        `io.${name}`,
        `net.${name}`,
    ],
    
    // Category-based fallbacks
    getCategoryIcon: (appName: string): string | null => {
        const name = appName.toLowerCase()
        
        const categories = [
            { keywords: ['player', 'music', 'video'], icons: ['multimedia-player-symbolic', 'applications-multimedia-symbolic'] },
            { keywords: ['terminal', 'console', 'shell'], icons: ['terminal-symbolic', 'utilities-terminal-symbolic'] },
            { keywords: ['editor', 'text', 'code'], icons: ['text-editor-symbolic', 'accessories-text-editor-symbolic'] },
            { keywords: ['file', 'folder', 'manager'], icons: ['folder-symbolic', 'file-manager-symbolic'] },
            { keywords: ['browser', 'web', 'chrome', 'firefox'], icons: ['web-browser-symbolic', 'applications-internet-symbolic'] },
        ]
        
        for (const category of categories) {
            if (category.keywords.some(keyword => name.includes(keyword))) {
                for (const icon of category.icons) {
                    if (isIcon(icon)) return icon
                }
            }
        }
        
        return null
    }
}

export const getValidIcon = (
    appIcon: string | null, 
    desktopEntry: string | null, 
    appName: string | null
): string => {
    // Try original appIcon first
    if (appIcon && (isIcon(appIcon) || fileExists(appIcon))) {
        return appIcon
    }
    
    // Try desktop entry
    if (desktopEntry) {
        const cleaned = desktopEntry.replace(/\.desktop$/, '')
        if (isIcon(cleaned) || fileExists(cleaned)) return cleaned
    }
    
    // Try app name variations
    if (appName) {
        const name = appName.toLowerCase()
        
        // Direct variations
        for (const variation of ICON_VARIATIONS.getNameVariations(name)) {
            if (isIcon(variation)) return variation
        }
        
        // Prefix variations
        for (const variation of ICON_VARIATIONS.getPrefixVariations(name)) {
            if (isIcon(variation)) return variation
        }
        
        // Word-based matching for multi-word names
        const words = name.split(/[\s\-_]+/).filter(word => word.length > 2)
        for (const word of words) {
            if (isIcon(word)) return word
            if (isIcon(`${word}-symbolic`)) return `${word}-symbolic`
        }
        
        // Category-based fallback
        const categoryIcon = ICON_VARIATIONS.getCategoryIcon(name)
        if (categoryIcon) return categoryIcon
    }
    
    // Generic fallbacks
    const fallbacks = [
        "application-x-executable",
        "application-default-icon", 
        "application-x-generic",
        "generic-application",
        "image-missing"
    ]
    
    for (const fallback of fallbacks) {
        if (isIcon(fallback)) return fallback
    }
    
    return "image-missing"
} 