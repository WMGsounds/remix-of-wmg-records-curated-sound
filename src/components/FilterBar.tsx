import { Search } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Filter bar field — label above, control below, centred.
 * Use inside the page filter/sort bar so spacing matches across the site.
 */
export const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col items-center gap-2">
    <label className="text-[11px] uppercase tracking-[0.24em] text-ivory/60">{label}</label>
    {children}
  </div>
);

/**
 * Shared search input styled to match the filter/sort selects.
 */
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" aria-hidden="true" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 w-[300px] bg-transparent border border-ivory/24 pl-9 pr-3 text-[11px] uppercase tracking-[0.24em] text-ivory placeholder:text-ivory/30 rounded-none focus:outline-none focus:ring-1 focus:ring-ivory/40"
    />
  </div>
);
