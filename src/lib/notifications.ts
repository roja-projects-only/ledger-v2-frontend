import { createElement } from "react";
import { toast } from "sonner";
import { CircleCheck, Info, OctagonX, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSemanticColor, type SemanticTone } from "@/lib/colors";

const toneIcons: Record<SemanticTone, typeof CircleCheck> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: OctagonX,
  info: Info,
};

type ToastMessage = Parameters<(typeof toast)["success"]>[0];
type ToastOptions = Parameters<(typeof toast)["success"]>[1];

type ToastResult = string | number;
type ToastFunction = (message: ToastMessage, options?: ToastOptions) => ToastResult;

function buildToastOptions(tone: SemanticTone, options?: ToastOptions): ToastOptions {
  const colors = getSemanticColor(tone);
  const Icon = toneIcons[tone];

  return {
    duration: 3500,
    ...options,
    icon: options?.icon ?? createElement(Icon, {
      className: cn("h-4 w-4", colors.icon),
    }),
    className: cn(
      "border shadow-md",
      colors.bg,
      colors.border,
      colors.text,
      options?.className,
    ),
    descriptionClassName: cn(colors.subtext, options?.descriptionClassName),
  };
}

function showToast(tone: SemanticTone, fn: ToastFunction, message: ToastMessage, options?: ToastOptions) {
  const result = fn(message, buildToastOptions(tone, options));
  return typeof result === "string" ? result : String(result);
}

export const notify = {
  success: (message: ToastMessage, options?: ToastOptions) =>
    showToast("success", toast.success, message, options),
  error: (message: ToastMessage, options?: ToastOptions) =>
    showToast("error", toast.error, message, options),
  warning: (message: ToastMessage, options?: ToastOptions) =>
    showToast("warning", toast.warning as ToastFunction, message, options),
  info: (message: ToastMessage, options?: ToastOptions) =>
    showToast("info", toast.info, message, options),
};

export type NotifyAPI = typeof notify;
