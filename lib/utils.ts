import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Announce a message to screen readers via the global live region.
 * The live region must exist in the DOM (added in dashboard layout).
 */
export function announce(message: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById('live-region')
  if (el) {
    el.textContent = ''
    // Small delay to ensure screen readers pick up the change
    requestAnimationFrame(() => {
      el.textContent = message
    })
  }
}
