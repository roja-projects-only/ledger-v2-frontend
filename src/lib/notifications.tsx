import { CircleCheck, Info, OctagonX, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "./utils";
import { getSemanticColor, type SemanticTone } from "./colors";

type IconComponent = typeof CircleCheck;

const toneIcons: Record<SemanticTone, IconComponent> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: OctagonX,
  info: Info,
};

type ToastMessage = Parameters<(typeof toast)["success"]>[0];
type ToastOptions = Parameters<(typeof toast)["success"]>[1];

type ToastFactory = (message: ToastMessage, options?: ToastOptions) => string | number;

const toastFactories: Record<SemanticTone, ToastFactory> = {
  success: toast.success,
  warning: toast.warning,
  error: toast.error,
  info: toast.info,
};

function buildToastOptions(tone: SemanticTone, options?: ToastOptions): ToastOptions {
  const colors = getSemanticColor(tone);
  const Icon = toneIcons[tone];

  return {
    duration: 3500,
    ...options,
    icon: options?.icon ?? <Icon className={cn("h-4 w-4", colors.icon)} />,
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

function showToast(tone: SemanticTone, message: ToastMessage, options?: ToastOptions) {
  const factory = toastFactories[tone];
  const toastOptions = buildToastOptions(tone, options);
  const result = factory(message, toastOptions);
  return typeof result === "string" ? result : String(result);
}

export const notify = {
  success: (message: ToastMessage, options?: ToastOptions) => showToast("success", message, options),
  error: (message: ToastMessage, options?: ToastOptions) => showToast("error", message, options),
  warning: (message: ToastMessage, options?: ToastOptions) => showToast("warning", message, options),
  info: (message: ToastMessage, options?: ToastOptions) => showToast("info", message, options),
};

export type NotifyAPI = typeof notify;
