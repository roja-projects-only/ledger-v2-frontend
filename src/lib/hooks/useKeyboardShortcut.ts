import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Command on Mac
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

export function useKeyboardShortcut(config: ShortcutConfig | ShortcutConfig[]) {
  useEffect(() => {
    const shortcuts = Array.isArray(config) ? config : [config];

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;
      
      // Allow '/' shortcut even in inputs (for search focus)
      if (isInput || isContentEditable) {
        if (event.key !== '/') return;
      }

      shortcuts.forEach((shortcut) => {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          handler,
        } = shortcut;

        // Check if the key matches
        const keyMatches = event.key.toLowerCase() === key.toLowerCase();

        // Check if modifiers match
        const ctrlMatches = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shift ? event.shiftKey : !event.shiftKey;
        const altMatches = alt ? event.altKey : !event.altKey;
        const metaMatches = meta ? event.metaKey : true; // Meta is optional

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault();
          handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config]);
}

// Export shortcut configs for documentation
export const GLOBAL_SHORTCUTS = {
  NEW_ENTRY: { key: 'k', ctrl: true, shift: true, description: 'New entry' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  CLOSE: { key: 'Escape', description: 'Close modal' },
  SEARCH: { key: '/', description: 'Focus search' },
  HELP: { key: '?', shift: true, description: 'Show shortcuts' },
} as const;
