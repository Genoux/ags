import { Gtk } from "astal/gtk3";

/**
 * Get app icon name for use with <icon icon={} />
 * @param appName - Application name (e.g., "Firefox", "Visual Studio Code")
 * @returns Icon name that exists in the current icon theme
 */
export function getAppIcon(appName?: string): string {
  const iconTheme = Gtk.IconTheme.get_default();
  
  // If no app name, return fallback
  if (!appName) {
    return 'application-x-executable';
  }
  
  // Generate potential icon names from app name
  const baseName = appName.toLowerCase();
  const candidates = [
    appName,                                    // Original case
    baseName,                                   // lowercase
    baseName.replace(/\s+/g, '-'),             // firefox-browser -> firefox-browser
    baseName.replace(/\s+/g, ''),              // visual studio code -> visualstudiocode  
    baseName.replace(/\s+/g, '_'),             // some_app_name
    baseName.split(/\s+/)[0],                  // first word only
    `${baseName}-symbolic`,                     // symbolic variant
    `${baseName.replace(/\s+/g, '-')}-symbolic` // dashed symbolic
  ];
  
  // Try each candidate
  for (const candidate of candidates) {
    if (candidate && iconTheme.has_icon(candidate)) {
      return candidate;
    }
  }
  
  // Final fallback
  return 'application-x-executable';
}