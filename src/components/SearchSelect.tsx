"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  searchTerms?: string; // extra searchable text (e.g. Hebrew aliases)
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchSelect({ value, onChange, options, placeholder, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? value) : "";

  const filtered = query.trim()
    ? options.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q) ||
          (o.searchTerms ?? "").includes(query)
        );
      })
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const select = (opt: SelectOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const handleFocus = () => {
    if (!disabled) {
      setOpen(true);
      setHighlighted(0);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center bg-white/5 border rounded-lg px-3 py-2 transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed border-white/10"
            : open
            ? "border-blue-500 ring-1 ring-blue-500"
            : "border-white/10 cursor-text"
        }`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={open ? query : displayLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={open ? "Type to search..." : placeholder}
          className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none disabled:cursor-not-allowed"
          autoComplete="off"
        />
        <ChevronDown
          size={14}
          className={`text-slate-400 ml-1 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          {filtered.length > 0 ? (
            <div ref={listRef} className="max-h-52 overflow-y-auto">
              {filtered.map((opt, i) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before select fires
                    select(opt);
                  }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    i === highlighted
                      ? "bg-blue-600/40 text-white"
                      : opt.value === value
                      ? "bg-blue-600/20 text-blue-300"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2.5 text-slate-500 text-sm">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
