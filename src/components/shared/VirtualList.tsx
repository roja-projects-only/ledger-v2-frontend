/**
 * VirtualList - Generic virtual scrolling component using @tanstack/react-virtual
 * 
 * Features:
 * - Renders only visible items for performance
 * - Supports large lists (100+ items) without performance degradation
 * - Configurable overscan for smooth scrolling
 * - Generic type support for any data type
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

interface VirtualListProps<T> {
  items: T[];
  estimateSize: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function VirtualList<T>({
  items,
  estimateSize,
  renderItem,
  overscan = 5,
  className = '',
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
