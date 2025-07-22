'use client';
import React, { useRef } from 'react';
// @ts-ignore missing types
import { useVirtual } from '@tanstack/react-virtual';
import { Equipo } from '@/types';
import { InventoryCard } from './InventoryCard';

interface VirtualInventoryGridProps {
  items: Equipo[];
  onItemClick: (equipo: Equipo) => void;
  cardHeight?: number; // px estimation
}

export default function VirtualInventoryGrid({ items, onItemClick, cardHeight = 340 }: VirtualInventoryGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer
  const rowVirtualizer = useVirtual({
    parentRef,
    size: items.length,
    overscan: 10,
    estimateSize: () => cardHeight,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-250px)] overflow-y-auto">
      <div
        style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
          const item = items[virtualRow.index];
          if (!item) return null;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: '1rem',
              }}
            >
              <InventoryCard equipo={item} onClick={() => onItemClick(item)} />
            </div>
          );
        })}
      </div>
    </div>
  );
} 