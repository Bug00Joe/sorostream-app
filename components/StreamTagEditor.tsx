"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import {
  getTagsForStream,
  addTagToStream,
  removeTagFromStream,
} from "@/src/lib/streamTags";

interface StreamTagEditorProps {
  streamId: string;
}

export default function StreamTagEditor({ streamId }: StreamTagEditorProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load tags from localStorage on mount and when streamId changes
  useEffect(() => {
    setTags(getTagsForStream(streamId));
  }, [streamId]);

  function addTag(rawTag: string) {
    const tag = rawTag.trim();
    if (!tag) return;
    if (tag.length > 32) {
      setError("Tags must be 32 characters or fewer.");
      return;
    }
    if (tags.includes(tag)) {
      setError(`Tag "${tag}" already exists.`);
      return;
    }
    addTagToStream(streamId, tag);
    setTags(getTagsForStream(streamId));
    setInput("");
    setError("");
  }

  function removeTag(tag: string) {
    removeTagFromStream(streamId, tag);
    setTags(getTagsForStream(streamId));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-gray-400 text-sm font-medium">Tags</p>

      {/* Tag chip list + input inline */}
      <div
        className="flex flex-wrap gap-1.5 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.length === 0 && !input && (
          <span className="text-gray-500 text-sm select-none pointer-events-none self-center">
            No tags — type a tag and press Enter
          </span>
        )}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-green-900/50 text-green-300 border border-green-700/60 rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              aria-label={`Remove tag ${tag}`}
              className="text-green-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400 rounded-full leading-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length > 0 ? "" : ""}
          aria-label="Add a tag"
          className="flex-1 min-w-[80px] bg-transparent text-white text-sm outline-none placeholder-gray-500"
        />
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-xs">
          {error}
        </p>
      )}

      <p className="text-gray-500 text-xs">
        Press <kbd className="bg-gray-700 px-1 py-0.5 rounded text-xs">Enter</kbd> or{" "}
        <kbd className="bg-gray-700 px-1 py-0.5 rounded text-xs">,</kbd> to add a tag.
        Press <kbd className="bg-gray-700 px-1 py-0.5 rounded text-xs">Backspace</kbd> to remove the last tag.
      </p>
    </div>
  );
}
