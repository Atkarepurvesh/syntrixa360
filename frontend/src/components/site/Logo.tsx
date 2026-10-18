import logoMark from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";

/**
 * Official Syntrixa360 mark (circular "S" logo) + text wordmark.
 * The PNG is bundled by Vite, so it renders everywhere without relying on hosted asset URLs.
 */
export function Logo({
  className,
  inverted = false,
  compact = false,
}: {
  className?: string;
  inverted?: boolean;
  /** Smaller mark + text for tight spots such as the sidebar inside product mock-ups. */
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 sm:gap-2.5",
        compact && "gap-1.5",
        className,
      )}
    >
      <img
        src={logoMark}
        alt="Syntrixa360 logo"
        width={512}
        height={512}
        decoding="async"
        className={cn(
          "shrink-0 rounded-full object-contain",
          compact ? "size-6" : "size-9 sm:size-10 lg:size-11",
        )}
      />
      <span
        className={cn(
          "font-extrabold tracking-tight whitespace-nowrap",
          compact ? "text-xs" : "text-base sm:text-lg lg:text-xl",
          inverted ? "text-white" : "text-navy",
        )}
      >
        SYNTRIXA<span className="text-brand">360</span>
      </span>
    </span>
  );
}
