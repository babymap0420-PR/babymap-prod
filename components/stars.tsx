import { cn } from "@/lib/cn";

export function Stars({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const full = Math.round(rating);
  const px = size === "sm" ? 12 : 15;

  return (
    <span className="inline-flex items-center gap-px" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          width={px}
          height={px}
          viewBox="0 0 24 24"
          className={cn(
            index < full ? "fill-[#fbbc04] text-[#fbbc04]" : "fill-[#e0e0e0] text-[#e0e0e0]",
          )}
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  );
}
