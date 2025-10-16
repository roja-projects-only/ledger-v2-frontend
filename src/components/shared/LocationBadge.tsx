import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocationColor } from "@/lib/colors";
import type { Location } from "@/lib/types";

interface LocationBadgeProps {
  location: Location;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<Required<LocationBadgeProps>["size"], string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

const ICON_SIZES: Record<Required<LocationBadgeProps>["size"], string> = {
  sm: "h-3 w-3 shrink-0",
  md: "h-3.5 w-3.5 shrink-0",
  lg: "h-4 w-4 shrink-0",
};

export function LocationBadge({
  location,
  showIcon = false,
  size = "md",
  className,
}: LocationBadgeProps) {
  const colors = getLocationColor(location);
  
  // Format location for display: replace underscores with spaces and capitalize
  const displayName = location.replace(/_/g, ' ').toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium border max-w-full",
        colors.bg,
        colors.text,
        colors.border,
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={`Location: ${displayName}`}
    >
      {showIcon && <MapPin className={ICON_SIZES[size]} />}
      <span className="capitalize truncate">{displayName}</span>
    </span>
  );
}
