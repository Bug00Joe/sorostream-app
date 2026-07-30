"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import StreamCard from "@/components/StreamCard";
import type { StreamData } from "@/src/lib/sorostream";

interface StreamVirtualListProps {
  streams: StreamData[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

/** Estimated row height in px (two-column grid). Grows if items are taller. */
const BASE_ROW_HEIGHT = 280;
const OVERSCAN_ROWS = 5;

export default function StreamVirtualList({ streams, selectedIds, onToggleSelect }: StreamVirtualListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTop = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(760);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight || 760);
    };

    updateHeight();

    const handleScroll = () => {
      savedScrollTop.current = container.scrollTop;
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateHeight);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollTop !== savedScrollTop.current) {
      container.scrollTop = savedScrollTop.current;
    }
  }, [streams]);

  /** Keyboard navigation inside the virtual list. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const ROW_PX = BASE_ROW_HEIGHT;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          container.scrollTop += ROW_PX / 2;
          break;
        case "ArrowUp":
          e.preventDefault();
          container.scrollTop -= ROW_PX / 2;
          break;
        case "PageDown":
          e.preventDefault();
          container.scrollTop += containerHeight;
          break;
        case "PageUp":
          e.preventDefault();
          container.scrollTop -= containerHeight;
          break;
        case "Home":
          e.preventDefault();
          container.scrollTop = 0;
          break;
        case "End":
          e.preventDefault();
          container.scrollTop = container.scrollHeight;
          break;
      }
    },
    [containerHeight],
  );

  const rowCount = useMemo(() => Math.ceil(streams.length / 2), [streams.length]);
  const totalHeight = rowCount * BASE_ROW_HEIGHT;

  const startRow = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / BASE_ROW_HEIGHT) - OVERSCAN_ROWS);
  }, [scrollTop]);

  const endRow = useMemo(() => {
    return Math.min(
      rowCount,
      Math.ceil((scrollTop + containerHeight) / BASE_ROW_HEIGHT) + OVERSCAN_ROWS,
    );
  }, [scrollTop, containerHeight, rowCount]);

  const visibleStreams = useMemo(
    () => streams.slice(startRow * 2, endRow * 2),
    [streams, startRow, endRow],
  );

  return (
    <div
      ref={containerRef}
      data-testid="stream-list"
      className="relative overflow-y-auto max-h-[calc(100vh-240px)]"
      role="list"
      aria-label="Stream list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${startRow * BASE_ROW_HEIGHT}px)`,
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {visibleStreams.map((stream, idx) => (
              <div
                key={stream.id}
                className="block"
                role="listitem"
              >
                <div className="relative">
                  <Link href={`/stream/${stream.id}`} className="block">
                    <StreamCard
                      id={stream.id}
                      sender={stream.sender}
                      recipient={stream.recipient}
                      flowRate={stream.flowRate}
                      deposit={stream.deposit}
                      status={stream.status}
                      selected={selectedIds?.has(stream.id)}
                      onToggle={onToggleSelect}
                      scheduledStartTime={stream.scheduledStartTime}
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {streams.length > 0 && (
        <div className="sr-only" aria-live="polite">
          Showing {Math.min(endRow * 2, streams.length)} of {streams.length} streams
        </div>
      )}
    </div>
  );
}
