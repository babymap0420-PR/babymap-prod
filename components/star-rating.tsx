"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";

export function Stars({
  value,
  size = 16,
}: {
  value: number;
  size?: number;
}) {
  const score = Math.min(5, Math.max(0, value));
  return (
    <span className="inline-flex items-center" aria-label={`${score.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, score - (star - 1)));
        return (
          <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-[#e7e5e4]" fill="#e7e5e4" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-[#f5b400]" fill="#f5b400" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= shown;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(star)}
            className="rounded-full p-0.5"
          >
            <Star
              size={size}
              className={cn(active ? "text-[#f5b400]" : "text-[#d6d3d1]")}
              fill={active ? "#f5b400" : "transparent"}
            />
          </button>
        );
      })}
    </div>
  );
}
