"use client";

import { useEffect, useState } from "react";
import { getTagsForStream } from "@/src/lib/streamTags";

interface StreamTagChipsProps {
  streamId: string;
  /** Optional: external tag list to display (skips localStorage lookup). */
  tags?: string[];
}

export default function StreamTagChips({ streamId, tags: propTags }: StreamTagChipsProps) {
  const [tags, setTags] = useState<string[]>(propTags ?? []);

  useEffect(() => {
    if (propTags) {
      setTags(propTags);
      return;
    }
    setTags(getTagsForStream(streamId));
  }, [streamId, propTags]);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5" aria-label={`Tags for stream ${streamId}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center bg-green-900/40 text-green-300 border border-green-700/50 rounded-full px-2 py-0.5 text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
