"use client";

export function ComboPicker({
  names,
  onPick,
  onClose,
}: {
  names: { id: string; name: string; type: string }[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(28,25,23,0.14)]">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[14px] font-bold text-[#1c1917]">
          {names.length} listings here
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] text-[#a8a29e]"
        >
          Close
        </button>
      </div>
      <ul className="border-t border-[#f0ebe3]">
        {names.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onPick(item.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#fafaf9]"
            >
              <span className="truncate text-[14px] font-medium text-[#1c1917]">
                {item.name}
              </span>
              <span className="ml-3 text-[12px] font-semibold tracking-wide text-[#a8a29e] uppercase">
                {item.type}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
