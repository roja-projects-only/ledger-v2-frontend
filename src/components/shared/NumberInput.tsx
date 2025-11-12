/**
 * NumberInput - Enhanced number input with plus/minus buttons and quick values
 * 
 * Features:
 * - Plus/minus buttons for incrementing/decrementing
 * - Quick value buttons (5, 10, 15, 20)
 * - Mobile numeric keyboard (inputMode="decimal")
 * - Haptic feedback on button presses
 * - Responsive layout (stacked on mobile, horizontal on desktop)
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";
import { useHaptics } from "@/lib/hooks/useHaptics";

// ============================================================================
// Types
// ============================================================================

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  quickValues?: number[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  quickValues = [5, 10, 15, 20],
  placeholder = "0",
  disabled = false,
  className,
  inputRef,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: NumberInputProps) {
  const { vibrate } = useHaptics();

  /**
   * Parse current value as number
   */
  const numValue = value ? parseFloat(value) : 0;

  /**
   * Handle increment
   */
  const handleIncrement = () => {
    const newValue = numValue + step;
    if (!max || newValue <= max) {
      onChange(String(newValue));
      vibrate("light");
    }
  };

  /**
   * Handle decrement
   */
  const handleDecrement = () => {
    const newValue = numValue - step;
    if (newValue >= min) {
      onChange(String(newValue));
      vibrate("light");
    }
  };

  /**
   * Handle quick value button
   */
  const handleQuickValue = (quickValue: number) => {
    onChange(String(quickValue));
    vibrate("selection");
  };

  /**
   * Handle manual input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string
    if (inputValue === "") {
      onChange("");
      return;
    }

    // Allow decimal numbers
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      // Apply min/max constraints
      if (numericValue < min) {
        onChange(String(min));
      } else if (max && numericValue > max) {
        onChange(String(max));
      } else {
        onChange(inputValue);
      }
    }
  };

  /**
   * Check if decrement is disabled
   */
  const isDecrementDisabled = disabled || numValue <= min;

  /**
   * Check if increment is disabled
   */
  const isIncrementDisabled = disabled || (max !== undefined && numValue >= max);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Input with plus/minus buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={isDecrementDisabled}
          className="h-10 w-10 shrink-0"
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="text-center text-lg font-medium"
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={isIncrementDisabled}
          className="h-10 w-10 shrink-0"
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick value buttons */}
      {quickValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickValues.map((quickValue) => (
            <Button
              key={quickValue}
              type="button"
              variant={numValue === quickValue ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickValue(quickValue)}
              disabled={disabled}
              className={cn(
                "flex-1 min-w-[60px]",
                numValue === quickValue && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {quickValue}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
