import type { CollectionStatus, PaymentStatus } from "@/lib/types";
import type { SemanticTone } from "@/lib/colors";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  COLLECTION: "Collection",
};

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  ACTIVE: "Active",
  OVERDUE: "Overdue",
  SUSPENDED: "Suspended",
};

export const MAX_TOP_CUSTOMERS = 6;

export const csvValue = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

export const getStatusTone = (status: PaymentStatus): SemanticTone => {
  switch (status) {
    case "PAID":
      return "success";
    case "PARTIAL":
    case "UNPAID":
      return "info";
    case "OVERDUE":
    case "COLLECTION":
      return "warning";
    default:
      return "info";
  }
};

export const getCollectionTone = (status: CollectionStatus): SemanticTone => {
  switch (status) {
    case "ACTIVE":
      return "info";
    case "OVERDUE":
      return "warning";
    case "SUSPENDED":
      return "error";
    default:
      return "info";
  }
};
