import { Astal } from "astal/gtk3";

/**
 * Simple, working icon utility using Astal's built-in icon lookup
 */
export class SimpleIconUtils {
  
  /**
   * Get app icon using simple pattern matching (your working approach)
   */
  static getAppIcon(appClass: string, fallback: string = 'application-x-executable'): string {
    if (!appClass) return fallback;

    // Generate possible icon names to try
    const possibleIcons = [
      appClass.toLowerCase(),                           // firefox
      `${appClass.toLowerCase()}-symbolic`,             // firefox-symbolic  
      appClass,                                         // Firefox
      `${appClass}-symbolic`,                           // Firefox-symbolic
      `${appClass.toLowerCase()}-app`,                  // firefox-app
      `${appClass.toLowerCase()}-desktop`,              // firefox-desktop
      `com.${appClass.toLowerCase()}.${appClass}`,      // com.firefox.Firefox
      `org.${appClass.toLowerCase()}.${appClass}`,      // org.firefox.Firefox
      fallback,                                         // Final fallback
    ];

    // Try each icon until we find one that exists
    for (const iconName of possibleIcons) {
      if (Astal.Icon.lookup_icon(iconName)) {
        return iconName;
      }
    }

    return 'dialog-information'; // Ultimate fallback
  }

  /**
   * Get tray icon (extract from gicon or use app name)
   */
  static getTrayIcon(item: any): string {
    // Try gicon first
    if (item.gicon) {
      const giconString = item.gicon.toString();
      if (giconString.includes('GThemedIcon')) {
        const match = giconString.match(/GThemedIcon\s+(.+)/);
        if (match) {
          const iconName = match[1].split(' ')[0];
          if (Astal.Icon.lookup_icon(iconName)) {
            return iconName;
          }
        }
      }
    }

    // Use app name from tray item
    const appName = item.title || item.tooltip?.title || item.icon_name || '';
    return this.getAppIcon(appName, 'application-x-executable');
  }

  /**
   * Get notification icon
   */
  static getNotificationIcon(notification: any): string {
    // Try provided app icon first
    if (notification.app_icon && Astal.Icon.lookup_icon(notification.app_icon)) {
      return notification.app_icon;
    }

    // Use app name
    const appName = notification.app_name || '';
    return this.getAppIcon(appName, 'dialog-information');
  }

  /**
   * Check if icon exists using Astal's lookup
   */
  static hasIcon(iconName: string): boolean {
    return Boolean(Astal.Icon.lookup_icon(iconName));
  }
}

// Export convenience functions
export const getAppIcon = SimpleIconUtils.getAppIcon.bind(SimpleIconUtils);
export const getTrayIcon = SimpleIconUtils.getTrayIcon.bind(SimpleIconUtils);
export const getNotificationIcon = SimpleIconUtils.getNotificationIcon.bind(SimpleIconUtils);
export const hasIcon = SimpleIconUtils.hasIcon.bind(SimpleIconUtils);