import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  buffer?: number;
  className?: string;
  emptyState?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  buffer = 4,
  className = '',
  emptyState = null
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const rAFRef = useRef<number | null>(null);

  // Passive, rAF-batched scroll listener
  const handleScroll = useCallback(() => {
    if (rAFRef.current !== null) return;
    rAFRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
      rAFRef.current = null;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
      if (rAFRef.current !== null) cancelAnimationFrame(rAFRef.current);
    };
  }, [handleScroll]);

  if (items.length === 0) {
    return <div className={`h-full w-full ${className}`}>{emptyState}</div>;
  }

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-y-auto relative custom-scrollbar ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
        <div
          style={{
            transform: `translate3d(0, ${offsetY}px, 0)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, idx) => (
            <div key={startIndex + idx} style={{ height: `${itemHeight}px` }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
